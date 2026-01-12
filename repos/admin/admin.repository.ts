import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminRepository {
    constructor(private prisma: PrismaService) { }

    async getCounts() {
        const [users, sessions] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.session.count({
                where: {
                    lastUsedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Active in last 24h
                    }
                }
            })
        ]);
        return { users, orgs: 0, sessions };
    }

    async getAuditLogs(skip = 0, take = 50, query?: string, outcome?: string, risk?: string) {
        const where: Prisma.AuditLogWhereInput = {};
        if (query) {
            where.OR = [
                { action: { contains: query, mode: 'insensitive' } },
                { actorName: { contains: query, mode: 'insensitive' } },
                { ipAddress: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } }
            ];
        }
        if (risk && risk !== 'All') {
            const riskMap: Record<string, string> = { 'High': 'critical', 'Medium': 'warning', 'Low': 'info' };
            where.severity = riskMap[risk] || risk.toLowerCase();
        }
        if (outcome && outcome !== 'All') {
            where.details = {
                path: ['outcome'],
                equals: outcome
            };
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { email: true, role: true } } }
            }),
            this.prisma.auditLog.count({ where })
        ]);

        return { logs, total };
    }

    // Org, Wallet, and Transaction methods removed

    async getOAuthClients(skip = 0, take = 50, query?: string) {
        const where: Prisma.OAuthClientWhereInput = {};
        if (query) {
            where.OR = [
                { clientId: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } }
            ];
        }

        const [apps, total] = await Promise.all([
            this.prisma.oAuthClient.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.oAuthClient.count({ where })
        ]);
        return { apps, total };
    }

    async getOAuthClientById(id: string) {
        return this.prisma.oAuthClient.findUnique({
            where: { clientId: id }
        });
    }

    async createOAuthClient(data: Prisma.OAuthClientUncheckedCreateInput) {
        return this.prisma.oAuthClient.create({ data });
    }

    async updateOAuthClient(id: string, data: Prisma.OAuthClientUpdateInput) {
        return this.prisma.oAuthClient.update({
            where: { clientId: id },
            data
        });
    }

    async deleteOAuthClient(id: string) {
        return this.prisma.oAuthClient.delete({
            where: { clientId: id }
        });
    }

    async getAdmins() {
        return this.prisma.user.findMany({
            where: {
                role: { in: ['SUPER_ADMIN', 'ADMIN'] }
            },
            select: {
                id: true,
                firstName: true,
                otherNames: true,
                email: true,
                role: true,
                lastLocation: true,
                // We'll use lastLocation or updated_at for "last active" approximation if session not joined
                updatedAt: true,
                emailVerified: true
            },
            orderBy: { role: 'asc' } // Super Admin first
        });
    }

    async getAdminByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email }
        });
    }

    async updateUserRole(userId: string, role: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { role }
        });
    }
}
