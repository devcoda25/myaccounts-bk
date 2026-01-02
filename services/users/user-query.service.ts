import { Injectable } from '@nestjs/common';
import { UserFindRepository } from '../../repos/users/user-find.repository';

@Injectable()
export class UserQueryService {
    constructor(private userFindRepo: UserFindRepository) { }

    async findOne(email: string) {
        return this.userFindRepo.findOneByEmail(email);
    }

    async findOneByIdentifier(identifier: string) {
        return this.userFindRepo.findOneByIdentifier(identifier);
    }

    async findById(id: string, options?: { kycRecord?: boolean; fullProfile?: boolean }) {
        const user = await this.userFindRepo.findOneById(id, {
            includeKyc: options?.kycRecord || options?.fullProfile,
            includeContacts: options?.fullProfile,
            includeCredentials: options?.fullProfile
        });
        if (!user) return null;
        return this.privateSanitize(user);
    }

    async findByEmail(email: string) {
        return this.userFindRepo.findOneByEmail(email);
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        query?: string;
        role?: string;
        status?: string;
    }) {
        const { users, total } = await this.userFindRepo.findAll(params);
        return {
            users: users.map(u => this.privateSanitize(u)),
            total
        };
    }

    private privateSanitize(user: any) {
        const { passwordHash, twoFactorSecret, ...rest } = user;
        return rest;
    }
}
