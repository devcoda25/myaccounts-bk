import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrgDomainRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.OrgDomainUncheckedCreateInput) {
        return this.prisma.orgDomain.create({ data });
    }

    async findAll(orgId: string) {
        return this.prisma.orgDomain.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findById(id: string) {
        return this.prisma.orgDomain.findUnique({ where: { id } });
    }

    async delete(id: string) {
        return this.prisma.orgDomain.delete({ where: { id } });
    }

    async setVerified(id: string) {
        return this.prisma.orgDomain.update({
            where: { id },
            data: {
                status: 'VERIFIED',
                verifiedAt: new Date()
            }
        });
    }

    async setFailed(id: string) {
        return this.prisma.orgDomain.update({
            where: { id },
            data: { status: 'FAILED' }
        });
    }

    async setPending(id: string) {
        return this.prisma.orgDomain.update({
            where: { id },
            data: { status: 'PENDING' }
        });
    }

    async update(id: string, data: Prisma.OrgDomainUpdateInput) {
        return this.prisma.orgDomain.update({
            where: { id },
            data
        });
    }
}
