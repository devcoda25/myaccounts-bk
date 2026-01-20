import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { SmsService } from '../../services/notifications/sms.service';
import { EmailService } from '../../services/notifications/email.service';
import { WhatsappService } from '../../services/notifications/whatsapp.service';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
    constructor(
        private verificationRepo: VerificationRepository,
        private userFindRepo: UserFindRepository,
        private userUpdateRepo: UserUpdateRepository,
        private smsService: SmsService,
        private emailService: EmailService,
        private whatsappService: WhatsappService
    ) { }

    async requestVerification(identifier: string, type: 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'PHONE_VERIFY', deliveryMethod?: string) {
        console.log(`[VerificationService] Requesting verification for ${identifier} via ${deliveryMethod}`);

        // SECURE GENERATION: crypto.randomInt
        const code = crypto.randomInt(100000, 1000000).toString();

        // Save to DB
        await this.verificationRepo.saveVerification(identifier, code, type);

        // Send via Channel
        if (deliveryMethod === 'sms_code') {
            await this.smsService.sendSms(identifier, `Your verification code is ${code}`);
        } else if (deliveryMethod === 'whatsapp_code') {
            await this.whatsappService.sendWhatsappCode(identifier, code);
        } else if (deliveryMethod === 'email_code' || deliveryMethod === 'email_link' || !deliveryMethod) {
            const frontend = process.env.FRONTEND_URL || 'https://accounts.evzone.app';

            let subject = 'Verification Code';
            let title = 'Verify Your Account';
            let actionLink = '';
            let actionText = '';

            if (type === 'PASSWORD_RESET') {
                subject = 'Reset Your Password';
                title = 'Reset Your Password';
                actionLink = `${frontend}/auth/reset-password?code=${code}&email=${encodeURIComponent(identifier)}`;
                actionText = 'Reset Password';
            } else if (type === 'EMAIL_VERIFY') {
                subject = 'Verify Your Email';
                title = 'Verify Your Email Address';
                // optional: link to verify directly? usually verify-email page takes code
                // actionLink = `${frontend}/auth/verify-email?code=${code}&email=${encodeURIComponent(identifier)}`;
                // actionText = 'Verify Email';
            }

            const html = `
                <h3>${title}</h3>
                ${actionLink ? `<p>Click the link below to proceed:</p>
                <p><a href="${actionLink}" style="background:#03cd8c;color:white;padding:10px 20px;text-decoration:none;border-radius:5px">${actionText}</a></p>` : ''}
                <p>Your verification code is: <b>${code}</b></p>
                <p><small>Code expires in 15 minutes.</small></p>
            `;
            await this.emailService.sendEmail(identifier, subject, `Verification code: ${code}`, html);
        }

        // REMOVED debug_code for security
        return { success: true };
    }

    async verifyEmail(identifier: string, code: string) {
        return this.verifyGeneric(identifier, code, 'EMAIL_VERIFY', async (user) => {
            await this.userUpdateRepo.markEmailVerified(user.id);
        });
    }

    async verifyPhone(identifier: string, code: string) {
        return this.verifyGeneric(identifier, code, 'PHONE_VERIFY', async (user) => {
            await this.userUpdateRepo.markPhoneVerified(user.id);
        });
    }

    // Unified Secure Verification Logic
    private async verifyGeneric(identifier: string, code: string, type: string, onSuccess: (user: import("@prisma/client").User) => Promise<void>) {
        const record = await this.verificationRepo.findVerification(identifier, code, type);

        // 1. Check if record exists (matches ID, Token, Type, Expiry)
        if (!record) {
            // If we can find the record by identifier+type but WRONG token, we increment attempts
            // However, findVerification only returns if generic match. We might need a repo method just to find by ID?
            // ideally we'd look up by identifier+type ONLY, then check token in code.
            // But existing repo `findVerification` checks token too. 
            // We can't increment attempts if we don't find the record. 
            // To properly do attempts, we should fetch by Identifier+Type first.
            // For this refactor, let's try to fetch active request first.
            const active = await this.verificationRepo.findActiveRequest(identifier, type);
            if (active) {
                await this.verificationRepo.incrementAttempts(active.id);
                if (active.attempts >= 2) { // 0, 1, 2 = 3rd fail effectively
                    await this.verificationRepo.deleteVerification(active.id);
                    throw new UnauthorizedException('Too many failed attempts. Request new code.');
                }
            }
            throw new UnauthorizedException('Invalid or expired code');
        }

        // If we found it via `findVerification`, it means token matched and not expired.
        // We still check attempts just in case
        // (Schema added attempts)
        const active = record; // record is VerificationRequest
        if (active.attempts >= 3) {
            await this.verificationRepo.deleteVerification(record.id);
            throw new UnauthorizedException('Too many failed attempts');
        }

        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (user) {
            await onSuccess(user);
        }

        await this.verificationRepo.deleteVerification(record.id);
        return { success: true, user };
    }


    async verifyCode(identifier: string, code: string, type: string) {
        // Used by Password Reset Service - needs similar hardening
        const active = await this.verificationRepo.findActiveRequest(identifier, type);
        if (active) {
            if (active.token !== code) {
                await this.verificationRepo.incrementAttempts(active.id);
                if (active.attempts >= 2) throw new UnauthorizedException('Too many failed attempts');
                return null;
            }
            // Success
            return active;
        }
        return null;
    }

    async consumeCode(id: string) {
        return this.verificationRepo.deleteVerification(id);
    }
}
