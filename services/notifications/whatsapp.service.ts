import { Injectable, Logger } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsappService {
    private logger = new Logger(WhatsappService.name);
    private client: Twilio;
    private fromNumber: string;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            this.logger.warn('Twilio credentials missing. WhatsApp sending will be simulated.');
            return;
        }

        this.client = new Twilio(accountSid, authToken);
        this.fromNumber = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    }

    async sendWhatsappCode(to: string, code: string) {
        if (!this.client) {
            this.logger.log(`[SIMULATION] Sending WhatsApp to ${to}: Your code is ${code}`);
            return { success: true, simulated: true };
        }

        try {
            const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

            const result = await this.client.messages.create({
                body: `Your verification code is: ${code}`,
                from: this.fromNumber,
                to: toFormatted
            });

            this.logger.log(`WhatsApp sent via Twilio to ${to}: ${result.sid}`);
            return { success: true, provider: 'twilio', id: result.sid };
        } catch (error: any) {
            this.logger.error(`Twilio WhatsApp Failed to ${to}`, error.message);
            return { success: false, error: error.message };
        }
    }
}
