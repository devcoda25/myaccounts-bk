import { Injectable, Logger } from '@nestjs/common';


@Injectable()
export class WhatsappService {
    private logger = new Logger(WhatsappService.name);
    private apiUrl: string;
    private accessToken: string;
    private phoneNumberId: string;

    constructor() {
        this.accessToken = process.env.WABA_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.WABA_PHONE_NUMBER_ID || '';
        // API Version v17.0 or v18.0
        this.apiUrl = `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`;

        if (!this.accessToken || !this.phoneNumberId) {
            this.logger.warn('WhatsApp Business API credentials (WABA) missing. WhatsApp sending will be simulated.');
        }
    }

    async sendWhatsappCode(to: string, code: string) {
        // 1. Try Twilio
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

        if (twilioSid && twilioToken && twilioFrom) {
            try {
                // Ensure Twilio 'from' has whatsapp: prefix if not present (usually required by SDK if not in env)
                // Env var usually is just the number (+1567...), SDK might need 'whatsapp:+1567...'
                const fromFormatted = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
                const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

                const client = require('twilio')(twilioSid, twilioToken);
                const result = await client.messages.create({
                    body: `Your verification code is: ${code}`,
                    from: fromFormatted,
                    to: toFormatted
                });

                this.logger.log(`WhatsApp sent via Twilio to ${to}: ${result.sid}`);
                return { success: true, provider: 'twilio', id: result.sid };
            } catch (error) {
                this.logger.error(`Twilio WhatsApp Failed to ${to}`, error.message);
                // Fallthrough to WABA
            }
        }

        // 2. Try WABA (Facebook Graph)
        // 'to' should be E.164 format without + if possible, or straight digits. WABA requires digits.
        const recipient = to.replace(/^\+/, '');

        if (!this.accessToken || !this.phoneNumberId) {
            this.logger.log(`[SIMULATION] Sending WhatsApp to ${recipient}: Your code is ${code}`);
            return { success: true, simulated: true };
        }

        try {
            const payload = {
                messaging_product: 'whatsapp',
                to: recipient,
                type: 'text',
                text: { body: `Your verification code is: ${code}` }
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json() as { error?: { message: string };[key: string]: any };

            if (!response.ok) {
                throw new Error(data?.error?.message || 'WhatsApp API Error');
            }

            this.logger.log(`WhatsApp sent to ${recipient}: ${JSON.stringify(data)}`);
            return data;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp to ${recipient}`, error.message);
            return { success: false, error: 'All WhatsApp providers failed' };
        }
    }
}
