import { Injectable, BadRequestException, UnauthorizedException, Inject, forwardRef, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';
import { VerificationService } from './verification.service';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as argon2 from 'argon2';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Entropy configuration for recovery codes
 * Using crypto.randomBytes ensures cryptographically secure random values
 */
const RECOVERY_CODE_BYTES = 4; // 4 bytes = 8 hex chars per segment
const RECOVERY_CODE_SEGMENTS = 2; // Two segments per code (XXXX-XXXX)
const RECOVERY_CODE_COUNT = 10; // Number of recovery codes to generate

/**
 * Encryption key must be exactly 32 bytes (256 bits) for AES-256-GCM
 * This is a critical security requirement
 */
const ENCRYPTION_KEY_ENV_VAR = 'ENCRYPTION_KEY';

/**
 * Validates that the encryption key meets security requirements
 * @param key - The encryption key to validate
 * @returns true if valid, throws error if not
 */
function validateEncryptionKey(key: string | undefined): string {
    if (!key) {
        throw new InternalServerErrorException(
            `Critical Security Error: ${ENCRYPTION_KEY_ENV_VAR} environment variable is not set. ` +
            `MFA encryption cannot function without a valid 32-byte key. ` +
            `Please set this variable in your environment configuration.`
        );
    }

    const keyBuffer = Buffer.from(key);
    if (keyBuffer.length !== 32) {
        throw new InternalServerErrorException(
            `Critical Security Error: ${ENCRYPTION_KEY_ENV_VAR} must be exactly 32 bytes (256 bits). ` +
            `Current length: ${keyBuffer.length} bytes. ` +
            `Regenerate your encryption key to ensure cryptographic security.`
        );
    }

    return key;
}

@Injectable()
export class MfaService {
    // Encryption key is validated on service initialization to fail-fast if missing
    private readonly encryptionKey: string;
    private readonly ivLength = 16;
    private readonly authTagLength = 16;

    constructor(
        private prisma: PrismaService,
        private verificationService: VerificationService
    ) {
        // Validate and set encryption key during construction (fail-fast)
        this.encryptionKey = validateEncryptionKey(process.env[ENCRYPTION_KEY_ENV_VAR]);
    }

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

    async sendChallenge(userId: string, channel: 'sms' | 'whatsapp' | 'email') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { contacts: true }
        });
        if (!user) throw new UnauthorizedException();

        // Find appropriate contact
        let contact;
        if (channel === 'email') {
            contact = user.contacts.find(c => c.type === 'EMAIL' && c.verified);
        } else {
            contact = user.contacts.find(c => {
                if (c.type !== 'PHONE' || !c.verified) return false;
                const caps = c.capabilities as Record<string, boolean> || {};
                return channel === 'whatsapp' ? caps['whatsapp'] === true : caps['sms'] === true;
            });
        }

        if (!contact) throw new BadRequestException(`No verified contact found for ${channel}`);

        const method = channel === 'whatsapp' ? 'whatsapp_message' : channel === 'email' ? 'email_code' : 'sms_code';
        const type = channel === 'email' ? 'EMAIL_VERIFY' : 'PHONE_VERIFY';

        await this.verificationService.requestVerification(contact.value, type, method);
        return { success: true, message: `Code sent to ${channel}` };
    }

    async verifyChallenge(userId: string, code: string, channel: 'authenticator' | 'sms' | 'whatsapp' | 'email') {
        if (channel === 'authenticator') {
            const valid = await this.verifyTotp(userId, code);
            if (!valid) throw new BadRequestException('Invalid TOTP code');
            return { success: true };
        } else {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: { contacts: true }
            });

            let contact;
            if (channel === 'email') {
                contact = user?.contacts.find(c => c.type === 'EMAIL' && c.verified);
            } else {
                contact = user?.contacts.find(c => {
                    if (c.type !== 'PHONE' || !c.verified) return false;
                    const caps = c.capabilities as Record<string, boolean> || {};
                    return channel === 'whatsapp' ? caps['whatsapp'] === true : caps['sms'] === true;
                });
            }

            if (!contact) throw new BadRequestException(`No contact found for ${channel}`);

            const type = channel === 'email' ? 'EMAIL_VERIFY' : 'PHONE_VERIFY';
            const record = await this.verificationService.verifyCode(contact.value, code, type);
            if (!record) throw new BadRequestException('Invalid or expired code');

            await this.verificationService.consumeCode(record.id);
            return { success: true };
        }
    }

    // --- Helpers ---

    /**
     * Generates cryptographically secure recovery codes using crypto.randomBytes
     * Format: XXXX-XXXX (8 hex chars per code)
     * Uses crypto.randomBytes for proper entropy (CSPRNG)
     */
    private async generateAndHashRecoveryCodes(): Promise<{ codes: string[]; hashedCodes: string[] }> {
        // Generate recovery codes with proper entropy
        const codes: string[] = [];
        for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
            // Generate 8 hex characters per segment using crypto.randomBytes
            const segment1 = randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase();
            const segment2 = randomBytes(RECOVERY_CODE_BYTES).toString('hex').toUpperCase();
            codes.push(`${segment1}-${segment2}`);
        }

        // Hash all codes for secure storage
        const hashedCodes = await Promise.all(codes.map(c => argon2.hash(c)));
        return { codes, hashedCodes };
    }

    /**
     * Encrypts sensitive data using AES-256-GCM
     * AES-256-GCM provides both confidentiality and authenticity
     * Format: iv:encrypted:authTag (hex encoded)
     * 
     * @param text - Plain text to encrypt
     * @returns Hex-encoded ciphertext with IV and auth tag
     */
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
            throw new InternalServerErrorException('Encryption failed');
        }
    }

    /**
     * Decrypts AES-256-GCM encrypted data
     * Validates the auth tag to ensure data integrity
     * 
     * @param text - Hex-encoded ciphertext (iv:encrypted:tag)
     * @returns Decrypted plain text
     */
    private decrypt(text: string): string {
        try {
            const parts = text.split(':');
            // Check if it looks encrypted (3 parts)
            if (parts.length !== 3) {
                // Legacy format or invalid - do not fallback to plain text for security
                throw new BadRequestException('Invalid encrypted data format');
            }

            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            const tag = Buffer.from(parts[2], 'hex');

            // Validate lengths
            if (iv.length !== this.ivLength || tag.length !== this.authTagLength) {
                throw new BadRequestException('Invalid encryption parameters');
            }

            const decipher = createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey), iv);
            decipher.setAuthTag(tag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (e) {
            console.error('Decryption failed', e);
            throw new BadRequestException('Failed to decrypt secret');
        }
    }
}
