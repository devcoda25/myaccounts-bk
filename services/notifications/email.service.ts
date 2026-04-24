import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { EmailProvider } from './email-providers/email-provider.interface';
import { SendGridProvider } from './email-providers/sendgrid.provider';
import { EmailJsProvider } from './email-providers/emailjs.provider';
import { SubmailProvider } from './email-providers/submail.provider';
import { MetricsService } from '../../src/metrics/metrics.service';
import type { EmailProviderLabel, EmailTypeLabel } from '../../src/metrics/custom-metrics';

const resolveMx = promisify(dns.resolveMx);

type Region = 'CN' | 'Global';

type EmailSendResult = {
    success: boolean;
    id?: string;
    error?: string;
};

function toProviderLabel(providerName: string): EmailProviderLabel {
    switch (providerName) {
        case 'sendgrid':
            return 'sendgrid';
        case 'apiGlobal':
            return 'emailjs';
        case 'apiCN':
            return 'submail';
        default:
            return 'unknown';
    }
}

@Injectable()
export class EmailService {
    private logger = new Logger(EmailService.name);
    private providers: Map<string, EmailProvider> = new Map();

    // Circuit Breaker State
    private failureCounts: Map<string, number[]> = new Map(); // timestamps of failures
    private readonly WINDOW_MS = 60000; // 1 minute window
    private THRESHOLD_RATE = 0.15;

    constructor(
        private sendGridProvider: SendGridProvider,
        private emailJsProvider: EmailJsProvider,
        private submailProvider: SubmailProvider,
        private metrics: MetricsService,
    ) {
        this.providers.set('sendgrid', sendGridProvider);
        this.providers.set('apiGlobal', emailJsProvider);
        this.providers.set('apiCN', submailProvider);

        this.THRESHOLD_RATE = Number(process.env.CIRCUIT_BREAKER_THRESHOLD) || 0.15;
    }

    // `type` is used for metrics (verification, password_reset, minor_approval, ...).
    async sendEmail(to: string, subject: string, text: string, html?: string, type: EmailTypeLabel = 'other') {
        const region = await this.detectRegion(to);
        const plan = this.getRoutingPlan(region);

        this.logger.log(`Routing email for ${to} (Region: ${region}). Plan: ${plan.join(' -> ')}`);

        for (const providerName of plan) {
            if (this.isCircuitOpen(providerName)) {
                this.logger.warn(`Skipping ${providerName} (Circuit Open)`);
                continue;
            }

            const provider = this.providers.get(providerName);
            if (!provider) continue;

            const providerLabel = toProviderLabel(providerName);

            let result: EmailSendResult;
            try {
                result = (await provider.send(to, subject, text, html)) as EmailSendResult;
            } catch (err) {
                this.metrics.recordEmailSend(providerLabel, 'failure', type);
                this.recordFailure(providerName);
                this.logger.warn(`Provider ${providerName} threw. Failover...`);
                continue;
            }

            if (result.success) {
                this.metrics.recordEmailSend(providerLabel, 'success', type);
                return result;
            }

            this.metrics.recordEmailSend(providerLabel, 'failure', type);
            this.recordFailure(providerName);
            this.logger.warn(`Provider ${providerName} failed. Failover...`);
        }

        if (process.env.NODE_ENV !== 'production') {
            // DEV-only fallback so local development is not blocked by provider config.
            this.logger.warn('All providers failed. Falling back to console log (DEV ONLY).');
            this.logger.log(`[EMAIL FALLBACK] To: ${to}, Subject: ${subject}, Text: ${text}`);
            this.metrics.recordEmailSend('console', 'success', type);
            return { success: true, id: 'console-fallback' };
        }

        this.metrics.recordEmailSend('unknown', 'failure', type);
        return { success: false, error: 'All providers failed' };
    }

    private async detectRegion(email: string): Promise<Region> {
        const domain = email.split('@')[1];
        const cnDomains = (process.env.REGION_CN_DOMAINS || '').split(',');

        // 1. Static Domain Check
        if (cnDomains.includes(domain)) return 'CN';
        if (domain.endsWith('.cn')) return 'CN';

        // 2. MX Record Check (if configured)
        if (process.env.REGION_GEOMAP_SOURCE === 'mx') {
            try {
                const mxRecords = await resolveMx(domain);
                if (mxRecords.some(r => r.exchange.includes('qq.com') || r.exchange.includes('163.com') || r.exchange.endsWith('.cn'))) {
                    return 'CN';
                }
            } catch {
                // ignore DNS errors
            }
        }

        return 'Global';
    }

    private getRoutingPlan(region: Region): string[] {
        const primary = process.env.PROVIDER_PRIMARY || 'sendgrid';
        const failover1 = process.env.PROVIDER_FAILOVER_1 || 'apiGlobal';
        const failoverCn = process.env.PROVIDER_FAILOVER_CN || 'apiCN';

        if (region === 'CN') {
            return [failoverCn, primary, failover1];
        }

        // Default Sequential: Primary -> Failover 1
        return [primary, failover1];
    }

    private isCircuitOpen(provider: string): boolean {
        const failures = this.failureCounts.get(provider) || [];
        const now = Date.now();
        const windowFailures = failures.filter(t => now - t < this.WINDOW_MS);

        return windowFailures.length >= 5;
    }

    private recordFailure(provider: string) {
        const now = Date.now();
        const failures = this.failureCounts.get(provider) || [];
        failures.push(now);
        const validFailures = failures.filter(t => now - t < this.WINDOW_MS);
        this.failureCounts.set(provider, validFailures);
    }

    async checkHealth(): Promise<'Operational' | 'Degraded'> {
        // Check SendGrid health (primary provider)
        const sendGridHealth = await this.sendGridProvider.checkHealth();
        return sendGridHealth ? 'Operational' : 'Degraded';
    }
}