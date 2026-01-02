import { Injectable, Logger } from '@nestjs/common';
import emailjs from '@emailjs/nodejs';
import { EmailProvider } from './email-provider.interface';

@Injectable()
export class EmailJsProvider implements EmailProvider {
    name = 'apiGlobal';
    private logger = new Logger(EmailJsProvider.name);

    constructor() {
        const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'placeholder_public'; // Fallback if not provided, assuming Access Token acts as private
        const privateKey = process.env.EMAILJS_ACCESS_TOKEN || process.env.EMAILJS_PRIVATE_KEY;

        if (privateKey) {
            emailjs.init({
                publicKey: publicKey,
                privateKey: privateKey,
            });
        } else {
            this.logger.warn('EmailJS credentials missing (ACCESS_TOKEN).');
        }
    }

    async send(to: string, subject: string, text: string, html?: string) {
        if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
            return { success: false, error: 'EmailJS Service/Template ID missing' };
        }

        try {
            const response = await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                {
                    to_email: to,
                    subject: subject,
                    message: text,
                    html_content: html // Assuming template supports this
                }
            );
            this.logger.log(`Sent via EmailJS: ${response.text}`);
            return { success: true, id: response.text };
        } catch (error) {
            this.logger.error('EmailJS Send Failed', error);
            return { success: false, error: error };
        }
    }
}
