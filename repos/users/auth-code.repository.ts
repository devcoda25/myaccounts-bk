import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, AuthCode } from '@prisma/client';

@Injectable()
export class AuthCodeRepository {
    constructor(private prisma: PrismaService) { }

    async createAuthCode(data: Prisma.AuthCodeCreateInput): Promise<AuthCode> {
        return this.prisma.authCode.create({ data });
    }

    async findAuthCode(code: string): Promise<AuthCode | null> {
        return this.prisma.authCode.findUnique({ where: { code } });
    }

    async updateAuthCode(code: string, data: Prisma.AuthCodeUpdateInput): Promise<AuthCode> {
        return this.prisma.authCode.update({
            where: { code },
            data,
        });
    }
}
