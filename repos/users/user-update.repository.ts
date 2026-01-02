import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserUpdateRepository {
    constructor(private prisma: PrismaService) { }

    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async updatePassword(userId: string, hash: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hash }
        });
    }

    async markEmailVerified(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true }
        });
    }

    async markPhoneVerified(userId: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { phoneVerified: true }
        });
    }
}
