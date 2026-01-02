import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { SmsService } from '../../services/notifications/sms.service';
import { EmailService } from '../../services/notifications/email.service';
import { WhatsappService } from '../../services/notifications/whatsapp.service';

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
        // Generate Code (Numeric for SMS/WhatsApp, String/Numeric for Email)
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB
        await this.verificationRepo.saveVerification(identifier, code, type);

        // Send via Channel
        if (deliveryMethod === 'sms_code') {
            await this.smsService.sendSms(identifier, `Your verification code is ${code}`);
        } else if (deliveryMethod === 'whatsapp_code') {
            await this.whatsappService.sendWhatsappCode(identifier, code);
        } else if (deliveryMethod === 'email_link' || !deliveryMethod) {
            // Default to email
            await this.emailService.sendEmail(identifier, 'Verification Code', `Your code is ${code}`);
        }

        return { success: true, debug_code: process.env.NODE_ENV !== 'production' ? code : undefined };
    }

    async verifyEmail(identifier: string, code: string) {
        const record = await this.verificationRepo.findVerification(identifier, code, 'EMAIL_VERIFY');
        if (!record) throw new UnauthorizedException('Invalid or expired code');

        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (user) {
            await this.userUpdateRepo.markEmailVerified(user.id);
        }

        await this.verificationRepo.deleteVerification(record.id);
        return { success: true, user };
    }

    async verifyPhone(identifier: string, code: string) {
        const record = await this.verificationRepo.findVerification(identifier, code, 'PHONE_VERIFY');
        if (!record) throw new UnauthorizedException('Invalid or expired code');

        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (user) {
            await this.userUpdateRepo.markPhoneVerified(user.id);
        }

        await this.verificationRepo.deleteVerification(record.id);
        return { success: true, user };
    }

    async verifyCode(identifier: string, code: string, type: string) {
        return this.verificationRepo.findVerification(identifier, code, type);
    }

    async consumeCode(id: string) {
        return this.verificationRepo.deleteVerification(id);
    }
}
