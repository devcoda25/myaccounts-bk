import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { EmailProvider } from './email-providers/email-provider.interface';
import { ZohoProvider } from './email-providers/zoho.provider';
import { EmailJsProvider } from './email-providers/emailjs.provider';
import { SubmailProvider } from './email-providers/submail.provider';

const resolveMx = promisify(dns.resolveMx);

@Injectable()
export class EmailService {
    private logger = new Logger(EmailService.name);
    private providers: Map<string, EmailProvider> = new Map();

    // Circuit Breaker State
    private failureCounts: Map<string, number[]> = new Map(); // timestamps of failures
    private readonly WINDOW_MS = 60000; // 1 minute window
    private THRESHOLD_RATE = 0.15;

    constructor(
        private zohoProvider: ZohoProvider,
        private emailJsProvider: EmailJsProvider,
        private submailProvider: SubmailProvider
    ) {
        this.providers.set('zohoSMTP', zohoProvider);
        this.providers.set('apiGlobal', emailJsProvider);
        this.providers.set('apiCN', submailProvider);

        this.THRESHOLD_RATE = Number(process.env.CIRCUIT_BREAKER_THRESHOLD) || 0.15;
    }

    async sendEmail(to: string, subject: string, text: string, html?: string) {
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

            const result = await provider.send(to, subject, text, html);

            if (result.success) {
                return result;
            } else {
                this.recordFailure(providerName);
                this.logger.warn(`Provider ${providerName} failed. Failover...`);
            }
        }

        if (process.env.NODE_ENV !== 'production') {
            this.logger.warn('All providers failed. Falling back to console log (DEV ONLY).');
            this.logger.log(`[EMAIL FALLBACK] To: ${to}, Subject: ${subject}, Text: ${text}`);
            return { success: true, id: 'console-fallback' };
        }

        return { success: false, error: 'All providers failed' };
    }

    private async detectRegion(email: string): Promise<'CN' | 'Global'> {
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
            } catch (e) {
                // ignore DNS errors
            }
        }

        return 'Global';
    }

    private getRoutingPlan(region: string): string[] {
        const primary = process.env.PROVIDER_PRIMARY || 'zohoSMTP';
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
}
