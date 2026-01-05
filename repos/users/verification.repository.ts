import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class VerificationRepository {
    constructor(private prisma: PrismaService) { }

    async saveVerification(identifier: string, token: string, type: string) {
        // We delete previous requests to keep it clean, OR we could just update logic.
        // For security Hardening, we want to START fresh.
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
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // STRICT 5 mins (was 10)
                attempts: 0
            }
        });
    }

    async incrementAttempts(id: string) {
        try {
            await this.prisma.verificationRequest.update({
                where: { id },
                data: {
                    attempts: { increment: 1 }
                }
            });
        } catch (e) {
            // Record might be deleted already
        }
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

    async findActiveRequest(identifier: string, type: string) {
        return this.prisma.verificationRequest.findFirst({
            where: {
                identifier,
                type,
                expiresAt: { gt: new Date() }
            }
        });
    }

    async deleteVerification(id: string) {
        return this.prisma.verificationRequest.delete({ where: { id } });
    }
}
