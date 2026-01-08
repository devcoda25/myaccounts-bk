import { Injectable, BadRequestException, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';
import { VerificationService } from './verification.service';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as argon2 from 'argon2';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class MfaService {
    // In production, this key should be in environment variables (32 chars for AES-256)
    private encryptionKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
    private ivLength = 16;

    constructor(
        private prisma: PrismaService,
        private verificationService: VerificationService
    ) { }

    async getStatus(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();
        return {
            enabled: user.twoFactorEnabled,
            methods: user.twoFactorEnabled ? ['Authenticator'] : [],
            recoveryCodesRemaining: user.recoveryCodes ? user.recoveryCodes.length : 0
        };
    }

    async generateSecret(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new UnauthorizedException();

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, 'EVzone MyAccounts', secret);
        const qrCodeUrl = await QRCode.toDataURL(otpauth);

        return { secret, qrCodeUrl };
    }

    async sendSmsCode(userId: string, phone: string) {
        // Use VerificationService to send code
        return this.verificationService.requestVerification(phone, 'PHONE_VERIFY', 'sms_code');
    }

    async verifyAndEnable(userId: string, token: string, secret?: string, method: 'authenticator' | 'sms' | 'whatsapp' = 'authenticator', phone?: string) {
        if (method === 'authenticator') {
            if (!secret) throw new BadRequestException('Secret required for Authenticator');
            const isValid = authenticator.verify({ token, secret });
            if (!isValid) throw new BadRequestException('Invalid OTP code');
        } else if (method === 'sms') {
            if (!phone) throw new BadRequestException('Phone number required for SMS');
            // Verify via VerificationService
            const record = await this.verificationService.verifyCode(phone, token, 'PHONE_VERIFY');
            if (!record) throw new BadRequestException('Invalid or expired SMS code');
            // Consume code
            await this.verificationService.consumeCode(record.id);
        }

        const { codes, hashedCodes } = await this.generateAndHashRecoveryCodes();

        // Update User
        const updateData: Prisma.UserUpdateInput = {
            twoFactorEnabled: true,
            recoveryCodes: hashedCodes
        };

        if (method === 'authenticator' && secret) {
            updateData.twoFactorSecret = this.encrypt(secret);
        }

        // If SMS, we might want to store the verified phone for 2FA use
        // For now, assuming user's main phone or a specific 2FA phone field.
        // Assuming current schema supports guardianChannels or similar, updating capabilities/channels:
        /*
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                guardianChannels: { ...existing, SMS: true } // This would need existing data fetch
            }
        });
        */

        await this.prisma.user.update({
            where: { id: userId },
            data: updateData
        });

        return { success: true, recoveryCodes: codes };
    }

    async regenerateRecoveryCodes(userId: string) {
        const { codes, hashedCodes } = await this.generateAndHashRecoveryCodes();

        await this.prisma.user.update({
            where: { id: userId },
            data: {
                recoveryCodes: hashedCodes
            }
        });

        return codes;
    }

    async disable(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                recoveryCodes: []
            }
        });
        return { success: true };
    }

    async verifyTotp(userId: string, token: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return false;

        try {
            const secret = this.decrypt(user.twoFactorSecret);
            return authenticator.verify({ token, secret });
        } catch (e) {
            // Decryption failed or secret invalid
            return false;
        }
    }

    // --- Helpers ---

    private async generateAndHashRecoveryCodes() {
        const codes = Array.from({ length: 10 }, () =>
            Math.random().toString(36).substring(2, 6) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
        );
        const hashedCodes = await Promise.all(codes.map(c => argon2.hash(c)));
        return { codes, hashedCodes };
    }

    private encrypt(text: string): string {
        try {
            const iv = randomBytes(this.ivLength);
            const cipher = createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            // Format: iv:encrypted:tag
            return iv.toString('hex') + ':' + encrypted + ':' + tag.toString('hex');
        } catch (e) {
            console.error('Encryption failed', e);
            throw new Error('Encryption failed');
        }
    }

    private decrypt(text: string): string {
        try {
            const parts = text.split(':');
            // Check if it looks encrypted (3 parts). If not, maybe it's legacy plain text.
            if (parts.length !== 3) return text;

            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const tag = Buffer.from(parts[2], 'hex');

            const decipher = createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            console.error('Decryption failed', e);
            return text; // Fallback to returning raw text if decryption fails (might be unencrypted)
        }
    }
}
