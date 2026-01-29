import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridProvider implements EmailProvider {
    name = 'sendgrid';
    private logger = new Logger(SendGridProvider.name);
    private initialized = false;

    constructor() {
        const apiKey = process.env.SENDGRID_API_KEY;

        if (!apiKey) {
            this.logger.warn('SendGrid API key missing from env. Provider not configured.');
            return;
        }

        sgMail.setApiKey(apiKey);
        this.initialized = true;
        this.logger.log('SendGrid provider initialized');
    }

    async send(to: string, subject: string, text: string, html?: string) {
        if (!this.initialized) {
            return { success: false, error: 'Provider not configured' };
        }

        try {
            const fromEmail = process.env.MAIL_FROM || 'noreply@evzone.com';
            const fromName = process.env.MAIL_FROM_NAME || 'EVzone';

            const msg = {
                to,
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                subject,
                text,
                html: html || text,
            };

            const [response] = await sgMail.send(msg);

            // SendGrid returns the message ID in the headers
            const messageId = response.headers['x-message-id'] || response.headers['X-Message-Id'];

            this.logger.log(`Sent via SendGrid to ${to}: ${messageId}`);
            return { success: true, id: messageId };
        } catch (error: any) {
            this.logger.error(`SendGrid send failed: ${error.message}`);

            // Log detailed error for debugging
            if (error.response?.body) {
                this.logger.error(`SendGrid error details: ${JSON.stringify(error.response.body)}`);
            }

            return { success: false, error: error.message };
        }
    }

    async checkHealth(): Promise<boolean> {
        if (!this.initialized) return false;

        try {
            // SendGrid doesn't have a direct health check endpoint
            // We can verify by trying to send a test email or checking API key validity
            const apiKey = process.env.SENDGRID_API_KEY;
            return !!apiKey && apiKey.length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Send bulk emails (SendGrid supports up to 1000 recipients per request)
     */
    async sendBulk(
        recipients: Array<{ email: string; name?: string }>,
        subject: string,
        text: string,
        html?: string
    ): Promise<{ success: boolean; error?: any }> {
        if (!this.initialized) {
            return { success: false, error: 'Provider not configured' };
        }

        try {
            const fromEmail = process.env.MAIL_FROM || 'noreply@evzone.com';
            const fromName = process.env.MAIL_FROM_NAME || 'EVzone';

            // SendGrid bulk sending using personalizations
            const personalizations = recipients.map(r => ({
                to: [{ email: r.email, name: r.name }],
            }));

            const msg = {
                personalizations,
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                subject,
                text,
                html: html || text,
            };

            const [response] = await sgMail.send(msg);
            const messageId = response.headers['x-message-id'];

            this.logger.log(`Bulk send via SendGrid to ${recipients.length} recipients: ${messageId}`);
            return { success: true };
        } catch (error: any) {
            this.logger.error(`SendGrid bulk send failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
