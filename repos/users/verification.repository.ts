import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class VerificationRepository {
    constructor(private prisma: PrismaService) { }

    async saveVerification(identifier: string, token: string, type: string) {
        try {
            await this.prisma.verificationRequest.deleteMany({
                where: { identifier, type }
            });
        } catch (e) { /* ignore */ }

        return this.prisma.verificationRequest.create({
            data: {
                identifier,
                token,
                type,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
            }
        });
    }

    async findVerification(identifier: string, token: string, type: string) {
        return this.prisma.verificationRequest.findFirst({
            where: {
                identifier,
                token,
                type,
                expiresAt: { gt: new Date() }
            }
        });
    }

    async deleteVerification(id: string) {
        return this.prisma.verificationRequest.delete({ where: { id } });
    }
}
