import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider } from './email-provider.interface';

@Injectable()
export class ZohoProvider implements EmailProvider {
    name = 'zohoSMTP';
    private logger = new Logger(ZohoProvider.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        if (!process.env.SMTP_HOST) {
            this.logger.warn('Zoho SMTP credentials missing from env.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 465,
            secure: process.env.SMTP_SECURE === 'true', // true for 465
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async send(to: string, subject: string, text: string, html?: string) {
        if (!this.transporter) {
            return { success: false, error: 'Provider not configured' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.MAIL_FROM || process.env.SMTP_USER,
                to,
                subject,
                text,
                html,
            });
            this.logger.log(`Sent via Zoho: ${info.messageId}`);
            return { success: true, id: info.messageId };
        } catch (error) {
            this.logger.error(`Zoho Send Failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async checkHealth(): Promise<boolean> {
        if (!this.transporter) return false;
        try {
            await this.transporter.verify();
            return true;
        } catch {
            return false;
        }
    }
}
