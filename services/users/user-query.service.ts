import { Injectable } from '@nestjs/common';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { SanitizedUserWithProfile, UserWithProfile } from '../../common/interfaces/user.interface';

@Injectable()
export class UserQueryService {
    constructor(private userFindRepo: UserFindRepository) { }

    async findOne(email: string) {
        return this.userFindRepo.findOneByEmail(email);
    }

    async findOneByIdentifier(identifier: string) {
        return this.userFindRepo.findOneByIdentifier(identifier);
    }

    async findById(id: string, options?: { kycRecord?: boolean; fullProfile?: boolean; includeSessions?: boolean; includeAuditLogs?: boolean }): Promise<SanitizedUserWithProfile | null> {
        const user = await this.userFindRepo.findOneById(id, {
            // includeKyc: options?.kycRecord || options?.fullProfile,
            includeContacts: options?.fullProfile,
            includeCredentials: options?.fullProfile,
            includeSessions: options?.includeSessions || options?.fullProfile,
            includeAuditLogs: options?.includeAuditLogs || options?.fullProfile,
            includeOrgs: options?.fullProfile
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
    }): Promise<{ users: SanitizedUserWithProfile[]; total: number }> {
        const { users, total } = await this.userFindRepo.findAll(params);
        return {
            users: users.map(u => this.privateSanitize(u)),
            total
        };
    }

    private privateSanitize(user: UserWithProfile): SanitizedUserWithProfile {
        const { passwordHash, twoFactorSecret, recoveryCodes, ...rest } = user;
        return rest;
    }
}
