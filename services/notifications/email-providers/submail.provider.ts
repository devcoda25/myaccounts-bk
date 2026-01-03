import { Injectable, Logger } from '@nestjs/common';

import { EmailProvider } from './email-provider.interface';

@Injectable()
export class SubmailProvider implements EmailProvider {
    name = 'apiCN';
    private logger = new Logger(SubmailProvider.name);
    private appId: string;
    private appKey: string;
    private apiUrl = 'https://api.mysubmail.com/mail/send';

    constructor() {
        this.appId = process.env.SUBMAIL_EMAIL_APP_ID || '';
        this.appKey = process.env.SUBMAIL_EMAIL_APP_KEY || '';

        if (!this.appId || !this.appKey) {
            this.logger.warn('Submail Email credentials missing.');
        }
    }

    async send(to: string, subject: string, text: string, html?: string) {
        if (!this.appId || !this.appKey) {
            return { success: false, error: 'Submail credentials missing' };
        }

        try {
            const payload = {
                appid: this.appId,
                signature: this.appKey,
                to: to,
                subject: subject,
                text: text,
                html: html
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Submail returns status: 'success' or 'error'
            const data: any = await response.json();

            if (data.status === 'success') {
                this.logger.log(`Sent via Submail: ${JSON.stringify(data)}`);
                return { success: true, id: data.send_id }; // adjust based on actual return
            } else {
                throw new Error(data.msg || 'Unknown Submail Error');
            }
        } catch (error) {
            this.logger.error(`Submail Send Failed: ${error.message}`, error.response?.data);
            return { success: false, error: error.message };
        }
    }
}
