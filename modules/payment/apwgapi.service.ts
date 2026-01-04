import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ApwgApiService {
    private readonly logger = new Logger(ApwgApiService.name);
    private readonly client: AxiosInstance;

    private readonly apiUrl: string;
    private readonly apiKey: string;
    private readonly encryptionPublicKey: string;
    private readonly webhookPublicKey: string;

    constructor(private configService: ConfigService) {
        this.apiUrl = this.configService.getOrThrow<string>('APWGAPI_URL');
        this.apiKey = this.configService.getOrThrow<string>('APWGAPI_API_KEY');

        // PEM keys usually come in base64 or raw string from env. 
        // Ensuring they are properly formatted PEMs is crucial.
        this.encryptionPublicKey = this.formatPem(
            this.configService.getOrThrow<string>('APWGAPI_PUBLIC_KEY'),
            'PUBLIC KEY'
        );
        this.webhookPublicKey = this.formatPem(
            this.configService.getOrThrow<string>('APWGAPI_WEBHOOK_PUBLIC_KEY'),
            'PUBLIC KEY'
        );

        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Encrypts a payload using Hybrid RSA+AES encryption.
     * 1. Generates ephemeral AES-256-CBC key and IV.
     * 2. Encrypts payload with AES.
     * 3. Encrypts AES key with APWGAPI Public RSA Key.
     */
    async encryptPayload(payload: any) {
        try {
            // 1. Generate Ephemeral AES Key (32 bytes) and IV (16 bytes)
            const aesKey = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);

            // 2. Encrypt Payload with AES
            const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
            let encryptedPayload = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
            encryptedPayload += cipher.final('hex');

            // 3. Encrypt AES Key with RSA Public Key
            const encryptedKey = crypto.publicEncrypt(
                {
                    key: this.encryptionPublicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256',
                },
                aesKey
            ).toString('base64');

            return {
                iv: iv.toString('hex'),
                key: encryptedKey,
                payload: encryptedPayload,
            };
        } catch (error) {
            this.logger.error('Encryption failed', error);
            throw new InternalServerErrorException('Failed to secure transaction payload');
        }
    }

    /**
     * Verifies a webhook signature using APWGAPI Webhook Public RSA Key.
     */
    verifySignature(signature: string, payload: any): boolean {
        try {
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
            return verifier.verify(this.webhookPublicKey, signature, 'base64');
        } catch (error) {
            this.logger.error('Signature verification failed', error);
            return false;
        }
    }

    /**
     * Initiates an incoming transaction (Deposit).
     */
    async initiateDeposit(data: {
        amount: number;
        currency: string;
        referenceId: string; // Our internal transaction ID
        provider: string; // e.g., 'mtn', 'stripe'
        channel: string; // e.g., 'mobile_money', 'card'
        userDetails: any;
        redirectUrl: string;
    }) {
        const payload = {
            action: 'charge',
            ...data,
            timestamp: new Date().toISOString(),
        };

        const encrypted = await this.encryptPayload(payload);

        try {
            const response = await this.client.post('/incoming', encrypted);
            return response.data;
        } catch (error) {
            this.handleApiError(error);
        }
    }

    /**
     * Initiates an outgoing transaction (Withdrawal).
     */
    async initiateWithdrawal(data: {
        amount: number;
        currency: string;
        referenceId: string;
        provider: string; // e.g. 'mtn'
        channel: string; // e.g. 'mobile_money'
        accountDetails: any; // e.g. phone number
    }) {
        const payload = {
            action: 'payout',
            ...data,
            timestamp: new Date().toISOString(),
        };

        const encrypted = await this.encryptPayload(payload);

        try {
            const response = await this.client.post('/outgoing', encrypted);
            return response.data;
        } catch (error) {
            this.handleApiError(error);
        }
    }

    /**
     * Helper to ensure PEM keys have headers/footers.
     */
    private formatPem(key: string, type: string): string {
        if (key.includes('BEGIN')) return key;
        const chunked = key.match(/.{1,64}/g)?.join('\n');
        return `-----BEGIN ${type}-----\n${chunked}\n-----END ${type}-----`;
    }

    private handleApiError(error: any) {
        if (axios.isAxiosError(error)) {
            this.logger.error(`APWGAPI Error: ${error.message}`, error.response?.data);
            throw new InternalServerErrorException(
                error.response?.data?.message || 'Payment gateway connection failed'
            );
        }
        throw error;
    }
}
