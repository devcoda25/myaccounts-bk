import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface';
import { Client } from '@sendgrid/client';

@Injectable()
export class SendGridProvider implements EmailProvider {
    name = 'sendgrid';
    private logger = new Logger(SendGridProvider.name);
    private initialized = false;
    private client: Client;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        const apiKey = process.env.SENDGRID_API_KEY || '';

        if (!apiKey) {
            this.logger.warn('SendGrid API key missing from env. Provider not configured.');
            return;
        }

        // Initialize the v8 client
        this.client = new Client();
        this.client.setApiKey(apiKey);

        this.fromEmail = process.env.MAIL_FROM || 'noreply@evzone.com';
        this.fromName = process.env.MAIL_FROM_NAME || 'EVzone';

        this.initialized = true;
        this.logger.log('SendGrid provider initialized');
    }

    async send(to: string, subject: string, text: string, html?: string) {
        if (!this.initialized) {
            return { success: false, error: 'Provider not configured' };
        }

        try {
            const request = {
                method: 'POST' as const,
                url: '/v3/mail/send',
                body: {
                    personalizations: [{ to: [{ email: to }] }],
                    from: {
                        email: this.fromEmail,
                        name: this.fromName,
                    },
                    subject,
                    content: [
                        { type: 'text/plain', value: text },
                        { type: 'text/html', value: html || text },
                    ],
                },
            };

            const [response, body] = await this.client.request(request);

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
        return this.initialized;
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
            const request = {
                method: 'POST' as const,
                url: '/v3/mail/send',
                body: {
                    personalizations: recipients.map(r => ({
                        to: [{ email: r.email, name: r.name }],
                    })),
                    from: {
                        email: this.fromEmail,
                        name: this.fromName,
                    },
                    subject,
                    content: [
                        { type: 'text/plain', value: text },
                        { type: 'text/html', value: html || text },
                    ],
                },
            };

            const [response, body] = await this.client.request(request);
            const messageId = response.headers['x-message-id'];

            this.logger.log(`Bulk send via SendGrid to ${recipients.length} recipients: ${messageId}`);
            return { success: true };
        } catch (error: any) {
            this.logger.error(`SendGrid bulk send failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
