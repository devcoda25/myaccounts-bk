import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChildProfileRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.ChildProfileUncheckedCreateInput) {
        return this.prisma.childProfile.create({ data });
    }

    async findManyByParentId(parentId: string) {
        return this.prisma.childProfile.findMany({
            where: { parentId },
            include: {
                approvals: true,
                activities: {
                    take: 10,
                    orderBy: { at: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneById(id: string) {
        return this.prisma.childProfile.findUnique({
            where: { id },
            include: {
                approvals: true,
                activities: {
                    orderBy: { at: 'desc' },
                },
            },
        });
    }

    async findOneByInviteCode(inviteCode: string) {
        return this.prisma.childProfile.findUnique({
            where: { inviteCode },
        });
    }

    async update(id: string, data: Prisma.ChildProfileUpdateInput) {
        return this.prisma.childProfile.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prisma.childProfile.delete({
            where: { id },
        });
    }
}
