import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns';
import { promisify } from 'util';
import { SendResult } from 'africastalking';
// @ts-ignore
import AfricasTalking = require('africastalking');
import Twilio from 'twilio';

interface AfricasTalkingClient {
    send: (params: { to: string[]; message: string; from?: string }) => Promise<SendResult>;
}

interface SubmailResponse {
    status: string;
    send_id?: string;
    fee?: number;
    msg?: string;
    money_account?: string;
}

const resolveMx = promisify(dns.resolveMx);

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
        const twilioFromNumber = process.env.TWILIO_SMS_FROM_NUMBER || '';
        this.logger.log(`Twilio configuration check: SID=${!!this.twilioSid}, Token=${!!twilioToken}, FromNumber=${!!twilioFromNumber}`);
        if (this.twilioSid && twilioToken && twilioFromNumber) {
            try {
                this.twilioClient = Twilio(this.twilioSid, twilioToken);
                this.logger.log('Twilio client initialized successfully');
            } catch (error) {
                this.logger.error(`Twilio initialization failed: ${error.message}`);
            }
        } else {
            this.logger.warn(`Twilio not configured properly: SID=${!!this.twilioSid}, Token=${!!twilioToken}, FromNumber=${!!twilioFromNumber}`);
        }

        if (!this.atApiKey && !this.twilioSid) {
            this.logger.warn('No SMS providers configured (AT or Twilio). SMS will be simulated.');
        }
    }

    async sendSms(to: string, message: string) {
        // Detect region for routing
        const region = await this.detectRegion(to);
        this.logger.log(`Sending SMS to ${to} (Region: ${region})`);
        this.logger.log(`Twilio client available: ${!!this.twilioClient}, AT client available: ${!!this.atClient}`);

        if (region === 'CN') {
            // For Asian countries, use Submail first
            return this.sendViaSubmail(to, message);
        }

        if (region === 'AFRICA') {
            // For African countries, use Africa's Talking first
            if (this.atClient) {
                try {
                    const result = await this.atClient.send({
                        to: [to],
                        message: message,
                        from: process.env.AFRICASTALKING_SMS_SENDER
                    });
                    this.logger.log(`SMS sent via Africa's Talking to ${to}: ${JSON.stringify(result)}`);
                    return { success: true, provider: 'africastalking', result };
                } catch (error) {
                    this.logger.error(`Africa's Talking SMS Failed to ${to}`, error);
                    // Fall through to Twilio if AT fails
                }
            } else {
                this.logger.warn(`Africa's Talking not configured for ${to}, falling back to Twilio`);
            }
        }

        // For other regions, try Twilio first, then Africa's Talking, then Submail
        // 1. Try Twilio
        if (this.twilioClient) {
            this.logger.log(`Attempting Twilio SMS to ${to} from ${process.env.TWILIO_SMS_FROM_NUMBER}`);
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
                this.logger.error(`Twilio error details: ${JSON.stringify(error)}`);
            }
        } else {
            this.logger.warn(`Twilio client not available, skipping...`);
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

    private async detectRegion(emailOrPhone: string): Promise<'CN' | 'AFRICA' | 'Global'> {
        // For phone numbers, check country code
        // +86 = China, +81 = Japan, +82 = South Korea, +84 = Vietnam, +60 = Malaysia, +62 = Indonesia, +66 = Thailand, +886 = Taiwan
        const cnCountryCodes = ['+86', '+881', '+882', '+883'];
        const asianCountryCodes = ['+81', '+82', '+84', '+60', '+62', '+66', '+886'];

        // African country codes - use Africa's Talking
        const africanCountryCodes = [
            '+256', // Uganda
            '+254', // Kenya
            '+255', // Tanzania
            '+250', // Rwanda
            '+251', // Ethiopia
            '+211', // South Sudan
            '+249', // Sudan
            '+252', // Somalia
            '+253', // Djibouti
            '+269', // Comoros
            '+230', // Mauritius
            '+258', // Mozambique
            '+27',  // South Africa
            '+233', // Ghana
            '+225', // Ivory Coast
            '+221', // Senegal
            '+223', // Mali
            '+224', // Guinea
            '+225', // Burkina Faso
            '+226', // Niger
            '+227', // Benin
            '+228', // Togo
            '+229', // Benin
            '+237', // Cameroon
            '+235', // Chad
            '+236', // Central African Republic
            '+241', // Gabon
            '+242', // Congo
            '+243', // DRC
            '+244', // Angola
            '+245', // Guinea-Bissau
            '+248', // Seychelles
        ];

        // Check for African country codes first (use Africa's Talking)
        for (const code of africanCountryCodes) {
            if (emailOrPhone.startsWith(code)) {
                this.logger.log(`Detected African phone number: ${emailOrPhone}, using Africa's Talking`);
                return 'AFRICA';
            }
        }

        // Check for CN country codes
        for (const code of cnCountryCodes) {
            if (emailOrPhone.startsWith(code)) return 'CN';
        }

        // Check for other Asian country codes
        for (const code of asianCountryCodes) {
            if (emailOrPhone.startsWith(code)) return 'CN';
        }

        return 'Global';
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

            const data = await response.json() as SubmailResponse;

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
