import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { SessionRepository } from '../../repos/auth/session.repository';

/**
 * Session information returned to the client
 * Sanitized to not expose sensitive data like token hashes
 */
export interface SessionInfo {
    id: string;
    clientId: string | null;
    clientName: string | null;
    deviceInfo: DeviceInfo | null;
    createdAt: Date;
    lastUsedAt: Date;
    expiresAt: Date;
}

export interface DeviceInfo {
    device: string;
    os: string;
    browser: string;
    location: string;
    ip: string;
}

@Injectable()
export class SessionManagementService {
    constructor(
        private prisma: PrismaService,
        private sessionRepo: SessionRepository
    ) { }

    /**
     * Get all active sessions for a user
     * Returns sanitized session info without sensitive data
     */
    async getUserSessions(userId: string): Promise<SessionInfo[]> {
        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() }, // Only active sessions
            },
            include: {
                client: {
                    select: {
                        clientId: true,
                        name: true,
                    },
                },
            },
            orderBy: { lastUsedAt: 'desc' },
        });

        return sessions.map(session => ({
            id: session.id,
            clientId: session.clientId,
            clientName: session.client?.name || null,
            deviceInfo: session.deviceInfo as DeviceInfo | null,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            expiresAt: session.expiresAt,
        }));
    }

    /**
     * Get a specific session by ID
     * Verifies the session belongs to the requesting user
     */
    async getSessionById(userId: string, sessionId: string): Promise<SessionInfo> {
        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                userId,
                expiresAt: { gt: new Date() },
            },
            include: {
                client: {
                    select: {
                        clientId: true,
                        name: true,
                    },
                },
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found or expired');
        }

        return {
            id: session.id,
            clientId: session.clientId,
            clientName: session.client?.name || null,
            deviceInfo: session.deviceInfo as DeviceInfo | null,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            expiresAt: session.expiresAt,
        };
    }

    /**
     * Revoke a specific session
     * Verifies the session belongs to the requesting user
     */
    async revokeSession(userId: string, sessionId: string): Promise<{ success: boolean }> {
        const session = await this.prisma.session.findFirst({
            where: {
                id: sessionId,
                userId,
            },
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        await this.sessionRepo.deleteSession(sessionId);
        return { success: true };
    }

    /**
     * Revoke all sessions for a user (logout everywhere)
     * Optionally keeps the current session
     */
    async revokeAllSessions(userId: string, keepCurrentSessionId?: string): Promise<{ revokedCount: number }> {
        const whereClause: Record<string, unknown> = {
            userId,
            expiresAt: { gt: new Date() },
        };

        // Exclude current session if specified
        if (keepCurrentSessionId) {
            whereClause.id = { not: keepCurrentSessionId };
        }

        // Get count before deletion for response
        const sessionsToDelete = await this.prisma.session.findMany({
            where: whereClause,
            select: { id: true },
        });

        // Delete all matching sessions
        await this.prisma.session.deleteMany({
            where: whereClause,
        });

        return { revokedCount: sessionsToDelete.length };
    }

    /**
     * Get active session count for a user
     * Useful for displaying "You are logged in on X devices"
     */
    async getActiveSessionCount(userId: string): Promise<number> {
        return this.prisma.session.count({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
        });
    }

    /**
     * Cleanup expired sessions
     * Should be called periodically (e.g., via cron job)
     */
    async cleanupExpiredSessions(): Promise<{ deletedCount: number }> {
        const result = await this.prisma.session.deleteMany({
            where: {
                expiresAt: { lte: new Date() },
            },
        });

        return { deletedCount: result.count };
    }

    /**
     * Get front-channel logout URLs for all active sessions
     * Used for Single Logout (SLO) to notify registered applications
     */
    async getFrontChannelLogoutUrls(userId: string): Promise<{ clientId: string; logoutUrl: string }[]> {
        const sessions = await this.prisma.session.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
            include: {
                client: {
                    where: {
                        post_logout_redirect_uris: { isEmpty: false },
                    },
                    select: {
                        clientId: true,
                        post_logout_redirect_uris: true,
                    },
                },
            },
        });

        const logoutUrls: { clientId: string; logoutUrl: string }[] = [];

        for (const session of sessions) {
            if (session.client && session.client.post_logout_redirect_uris.length > 0) {
                // Use the first post-logout redirect URI
                // In production, you might want to choose based on the request origin
                logoutUrls.push({
                    clientId: session.client.clientId,
                    logoutUrl: session.client.post_logout_redirect_uris[0],
                });
            }
        }

        return logoutUrls;
    }
}
