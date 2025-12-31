import { Injectable } from '@nestjs/common';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import * as argon2 from 'argon2';

@Injectable()
export class UserManagementService {
    constructor(
        private userCreateRepo: UserCreateRepository,
        private userUpdateRepo: UserUpdateRepository
    ) { }

    async create(data: any) {
        const { countryCode, phone, password, ...rest } = data;
        let phoneNumber = phone;
        if (countryCode && phone && !phone.startsWith('+')) {
            phoneNumber = `${countryCode}${phone}`;
        }
        let passwordHash = undefined;
        if (password) {
            passwordHash = await argon2.hash(password);
        }
        return this.userCreateRepo.create({
            ...rest,
            phoneNumber,
            passwordHash,
        });
    }

    async updateProfile(userId: string, data: any) {
        return this.userUpdateRepo.update(userId, data);
    }
}
