import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { OrgInvite, Prisma } from '@prisma/client';

@Injectable()
export class OrgInviteRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.OrgInviteUncheckedCreateInput) {
        return this.prisma.orgInvite.create({ data });
    }

    async findAll(orgId: string) {
        return this.prisma.orgInvite.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findPending(orgId: string) {
        return this.prisma.orgInvite.findMany({
            where: { orgId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByToken(token: string) {
        return this.prisma.orgInvite.findUnique({
            where: { token },
            include: { organization: true }
        });
    }

    async revoke(id: string) {
        return this.prisma.orgInvite.update({
            where: { id },
            data: { status: 'REVOKED' }
        });
    }

    async accept(id: string) {
        return this.prisma.orgInvite.update({
            where: { id },
            data: { status: 'ACCEPTED' }
        });
    }
}
