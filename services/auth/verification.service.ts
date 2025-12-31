import { Injectable, UnauthorizedException } from '@nestjs/common';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';

@Injectable()
export class VerificationService {
    constructor(
        private verificationRepo: VerificationRepository,
        private userFindRepo: UserFindRepository,
        private userUpdateRepo: UserUpdateRepository
    ) { }

    async requestVerification(identifier: string, type: 'EMAIL_VERIFY' | 'PASSWORD_RESET') {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.verificationRepo.saveVerification(identifier, code, type);
        return { success: true, debug_code: code };
    }

    async verifyEmail(identifier: string, code: string) {
        const record = await this.verificationRepo.findVerification(identifier, code, 'EMAIL_VERIFY');
        if (!record) throw new UnauthorizedException('Invalid or expired code');

        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (user) {
            await this.userUpdateRepo.markEmailVerified(user.id);
        }

        await this.verificationRepo.deleteVerification(record.id);
        return { success: true };
    }

    async verifyCode(identifier: string, code: string, type: string) {
        return this.verificationRepo.findVerification(identifier, code, type);
    }

    async consumeCode(id: string) {
        return this.verificationRepo.deleteVerification(id);
    }
}
