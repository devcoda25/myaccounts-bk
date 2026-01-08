import { Injectable, Logger } from '@nestjs/common';
import AfricasTalking = require('africastalking');
import * as Twilio from 'twilio';

interface AfricasTalkingClient {
    send: (params: { to: string[]; message: string; from?: string }) => Promise<any>;
}

@Injectable()
export class SmsService {
    private logger = new Logger(SmsService.name);
    private atClient: AfricasTalkingClient;
    private twilioClient: Twilio.Twilio;

    private atApiKey: string;
    private twilioSid: string;

    constructor() {
        // Africa's Talking
        this.atApiKey = process.env.AFRICASTALKING_API_KEY || '';
        const atUsername = process.env.AFRICASTALKING_USERNAME || 'sandbox';

        if (this.atApiKey) {
            const at = AfricasTalking({ apiKey: this.atApiKey, username: atUsername });
            this.atClient = at.SMS;
        }

        // Twilio
        this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        if (this.twilioSid && twilioToken) {
            this.twilioClient = Twilio(this.twilioSid, twilioToken);
        }

        if (!this.atApiKey && !this.twilioSid) {
            this.logger.warn('No SMS providers configured (AT or Twilio). SMS will be simulated.');
        }
    }

    async sendSms(to: string, message: string) {
        // 1. Try Twilio
        if (this.twilioClient) {
            try {
                const result = await this.twilioClient.messages.create({
                    body: message,
                    from: process.env.TWILIO_SMS_FROM_NUMBER,
                    to: to
                });
                this.logger.log(`SMS sent via Twilio to ${to}: ${result.sid}`);
                return { success: true, provider: 'twilio', id: result.sid };
            } catch (error) {
                this.logger.error(`Twilio SMS Failed to ${to}: ${error.message}`);
                // Fallthrough to next provider
            }
        }

        // 2. Try Africa's Talking
        if (this.atClient) {
            try {
                const result = await this.atClient.send({
                    to: [to],
                    message: message,
                    from: process.env.AFRICASTALKING_SMS_SENDER
                });
                this.logger.log(`SMS sent via AT to ${to}: ${JSON.stringify(result)}`);
                return result;
            } catch (error) {
                this.logger.error(`AT SMS Failed to ${to}`, error);
            }
        }

        // 3. Submail / Simulation
        return this.sendViaSubmail(to, message);
    }

    private async sendViaSubmail(to: string, message: string) {
        const appId = process.env.SUBMAIL_SMS_APP_ID;
        const appKey = process.env.SUBMAIL_SMS_APP_KEY;

        if (!appId || !appKey) {
            this.logger.log(`[SIMULATION] Sending SMS to ${to}: ${message}`);
            return { success: true, simulated: true };
        }

        try {
            const apiUrl = 'https://api.mysubmail.com/message/send';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appid: appId,
                    signature: appKey,
                    to: to,
                    content: `【${process.env.AFRICASTALKING_SMS_SENDER || 'EV-ZONE'}】${message}`
                })
            });

            const data = await response.json() as { status: string; msg?: string;[key: string]: any };

            if (data.status === 'success') {
                this.logger.log(`SMS sent via Submail to ${to}: ${JSON.stringify(data)}`);
                return { success: true, provider: 'submail' };
            } else {
                throw new Error(data.msg);
            }
        } catch (error) {
            this.logger.error(`Submail SMS Failed to ${to}`, error);
            return { success: false, error: 'All providers failed' };
        }
    }
}
