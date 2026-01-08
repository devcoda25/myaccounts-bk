import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.OrganizationCreateInput) {
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

    async update(id: string, data: Prisma.OrganizationUpdateInput) {
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

    // --- Custom Roles ---
    async createRole(orgId: string, data: { name: string; description?: string; permissions?: Prisma.InputJsonValue }) {
        return this.prisma.orgRole.create({
            data: {
                orgId,
                name: data.name,
                description: data.description,
                permissions: data.permissions || Prisma.JsonNull
            }
        });
    }

    async getRoles(orgId: string) {
        return this.prisma.orgRole.findMany({
            where: { orgId }
        });
    }

    async updateRole(orgId: string, roleId: string, data: Prisma.OrgRoleUpdateInput) {
        // proprietary check for safety
        const role = await this.prisma.orgRole.findFirst({ where: { id: roleId, orgId } });
        if (!role) {
            // Throwing simple error or return null to let service handle it. 
            // Service expects a promise that resolves. 
            // If the service catches errors, throwing is fine.
            throw new Error('Role not found or does not belong to organization');
        }

        return this.prisma.orgRole.update({
            where: { id: roleId },
            data
        });
    }

    async deleteRole(orgId: string, roleId: string) {
        const role = await this.prisma.orgRole.findFirst({ where: { id: roleId, orgId } });
        if (!role) {
            throw new Error('Role not found or does not belong to organization');
        }
        return this.prisma.orgRole.delete({
            where: { id: roleId }
        });
    }
}
