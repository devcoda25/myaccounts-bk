import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Session } from '@prisma/client';

@Injectable()
export class SessionRepository {
    constructor(private prisma: PrismaService) { }

    async createSession(data: {
        userId: string;
        tokenHash?: string;
        expiresAt: Date;
        deviceInfo?: any;
    }): Promise<Session> {
        return this.prisma.session.create({
            data: {
                userId: data.userId,
                refreshTokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
                deviceInfo: data.deviceInfo,
            },
        });
    }

    async findSessionById(id: string): Promise<Session | null> {
        return this.prisma.session.findUnique({
            where: { id },
        });
    }

    async deleteSession(id: string): Promise<Session> {
        return this.prisma.session.delete({
            where: { id },
        });
    }

    async deleteUserSessions(userId: string): Promise<any> {
        return this.prisma.session.deleteMany({
            where: { userId },
        });
    }

    async findActiveSessionsByUser(userId: string) {
        return this.prisma.session.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() }
            },
            orderBy: { lastUsedAt: 'desc' }
        });
    }

    async updateSessionChallenge(id: string, challenge: string | null) {
        return this.prisma.session.update({
            where: { id },
            data: { passkeyChallenge: challenge }
        });
    }
}
