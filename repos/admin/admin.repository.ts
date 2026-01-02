import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class AdminRepository {
    constructor(private prisma: PrismaService) { }

    async getCounts() {
        const [users, orgs, sessions] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.organization.count(),
            this.prisma.session.count({
                where: {
                    lastUsedAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);
        return { users, orgs, sessions };
    }

    async getAuditLogs(skip = 0, take = 50, query?: string, outcome?: string, risk?: string) {
        const where: any = {};
        if (query) {
            where.OR = [
                { action: { contains: query, mode: 'insensitive' } },
                { actorName: { contains: query, mode: 'insensitive' } },
                { ipAddress: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } }
            ];
        }
        if (risk && risk !== 'All') {
            const riskMap: any = { 'High': 'critical', 'Medium': 'warning', 'Low': 'info' };
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

    async getTotalWalletBalance() {
        // Aggregate sum of balances
        const agg = await this.prisma.wallet.aggregate({
            _sum: {
                balance: true
            }
        });
        return agg._sum.balance || 0;
    }
    async getOrgs(skip = 0, take = 50, query?: string, status?: string) {
        const where: any = {};
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { domain: { contains: query, mode: 'insensitive' } }
            ];
        }

        const [orgs, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    members: {
                        where: { role: 'Owner' },
                        include: { user: { select: { email: true, firstName: true, otherNames: true } } }
                    },
                    _count: {
                        select: { members: true }
                    }
                }
            }),
            this.prisma.organization.count({ where })
        ]);

        return { orgs, total };
    }

    async getOrgById(id: string) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                otherNames: true,
                                avatarUrl: true,
                                emailVerified: true
                            }
                        }
                    },
                    orderBy: { role: 'asc' } // Owner first usually if strict alphabetical, but roughly okay
                },
                _count: {
                    select: { members: true }
                }
            }
        });
    }

    async getWallets(skip = 0, take = 50, query?: string, status?: string) {
        const where: any = {};
        if (status && status !== 'All') {
            where.status = status.toLowerCase();
        }
        if (query) {
            where.OR = [
                { id: { contains: query, mode: 'insensitive' } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
                { user: { firstName: { contains: query, mode: 'insensitive' } } },
                { user: { otherNames: { contains: query, mode: 'insensitive' } } }
            ];
        }

        const [wallets, total] = await Promise.all([
            this.prisma.wallet.findMany({
                where,
                skip,
                take,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            email: true,
                            firstName: true,
                            otherNames: true,
                            kyc: {
                                select: { riskScore: true }
                            }
                        }
                    },
                    transactions: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: { createdAt: true }
                    }
                }
            }),
            this.prisma.wallet.count({ where })
        ]);

        return { wallets, total };
    }

    async getDetailedWalletStats() {
        const [ugxSum, usdSum, frozenCount] = await Promise.all([
            this.prisma.wallet.aggregate({
                where: { currency: 'UGX' },
                _sum: { balance: true }
            }),
            this.prisma.wallet.aggregate({
                where: { currency: 'USD' },
                _sum: { balance: true }
            }),
            this.prisma.wallet.count({
                where: { status: 'frozen' }
            })
        ]);

        return {
            totalUGX: Number(ugxSum._sum.balance) || 0,
            totalUSD: Number(usdSum._sum.balance) || 0,
            frozenCount
        };
    }

    async updateWalletStatus(id: string, status: string) {
        return this.prisma.wallet.update({
            where: { id },
            data: { status }
        });
    }

    async getTransactions(skip = 0, take = 50, query?: string, type?: string, status?: string) {
        const where: any = {};
        if (status && status !== 'All') {
            // Success -> completed, Failed -> failed, Pending -> pending
            const statusMap: any = { 'Success': 'completed', 'Failed': 'failed', 'Pending': 'pending' };
            where.status = statusMap[status] || status.toLowerCase();
        }
        if (type && type !== 'All') {
            where.type = type.toLowerCase();
        }
        if (query) {
            where.OR = [
                { id: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { wallet: { user: { email: { contains: query, mode: 'insensitive' } } } },
                { wallet: { user: { firstName: { contains: query, mode: 'insensitive' } } } },
                { wallet: { user: { otherNames: { contains: query, mode: 'insensitive' } } } },
                { wallet: { organization: { name: { contains: query, mode: 'insensitive' } } } }
            ];
        }

        const [txs, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    wallet: {
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    firstName: true,
                                    otherNames: true
                                }
                            },
                            organization: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.transaction.count({ where })
        ]);

        return { txs, total };
    }
}
