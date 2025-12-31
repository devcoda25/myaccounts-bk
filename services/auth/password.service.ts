import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { VerificationService } from './verification.service';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
    constructor(
        private userUpdateRepo: UserUpdateRepository,
        private userFindRepo: UserFindRepository,
        private verificationService: VerificationService
    ) { }

    async resetPassword(identifier: string, code: string, newPass: string) {
        const record = await this.verificationService.verifyCode(identifier, code, 'PASSWORD_RESET');
        if (!record) throw new UnauthorizedException('Invalid or expired code');

        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (!user) throw new UnauthorizedException('User not found');

        const hash = await argon2.hash(newPass);
        await this.userUpdateRepo.updatePassword(user.id, hash);

        await this.verificationService.consumeCode(record.id);
        return { success: true };
    }

    async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await this.userFindRepo.findOneById(userId);
        if (!user || !user.passwordHash) throw new UnauthorizedException('User not found');

        const valid = await argon2.verify(user.passwordHash, oldPass);
        if (!valid) throw new UnauthorizedException('Invalid current password');

        const hash = await argon2.hash(newPass);
        await this.userUpdateRepo.updatePassword(userId, hash);

        return { success: true };
    }
}
