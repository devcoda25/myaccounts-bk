import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class OrganizationRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.organization.create({
            data
        });
    }

    async findById(id: string) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                otherNames: true,
                                email: true,
                                avatarUrl: true
                            }
                        }
                    }
                },
                wallets: {
                    take: 1
                },
                auditLogs: {
                    take: 5,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
    }

    async getUserOrgs(userId: string) {
        return this.prisma.userOrganization.findMany({
            where: { userId },
            include: {
                organization: true
            }
        });
    }

    async update(id: string, data: any) {
        return this.prisma.organization.update({
            where: { id },
            data
        });
    }

    async getMembers(orgId: string) {
        return this.prisma.userOrganization.findMany({
            where: { orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        otherNames: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });
    }

    async updateMemberRole(orgId: string, userId: string, role: string) {
        return this.prisma.userOrganization.update({
            where: {
                userId_orgId: {
                    userId,
                    orgId
                }
            },
            data: { role }
        });
    }

    async addMember(orgId: string, userId: string, role: string) {
        return this.prisma.userOrganization.create({
            data: {
                orgId,
                userId,
                role
            }
        });
    }

    async removeMember(orgId: string, userId: string) {
        return this.prisma.userOrganization.delete({
            where: {
                userId_orgId: {
                    userId,
                    orgId
                }
            }
        });
    }

    async createWallet(orgId: string, currency: string = 'USD') {
        return this.prisma.wallet.create({
            data: {
                orgId,
                currency,
                balance: 0,
                status: 'active'
            }
        });
    }

    async updateMemberStatus(orgId: string, userId: string, status: string) {
        return this.prisma.userOrganization.update({
            where: {
                userId_orgId: {
                    userId,
                    orgId
                }
            },
            data: { status }
        });
    }

    async getMembersByRole(orgId: string) {
        const result = await this.prisma.userOrganization.groupBy({
            by: ['role'],
            where: { orgId },
            _count: {
                role: true
            }
        });

        // Transform to { Owner: 1, Admin: 2, ... }
        const roleCounts: Record<string, number> = {};
        result.forEach(r => {
            roleCounts[r.role] = r._count.role;
        });
        return roleCounts;
    }
}
