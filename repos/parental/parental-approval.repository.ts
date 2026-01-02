import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class ParentalApprovalRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.parentalApproval.create({ data });
    }

    async findManyByChildId(childId: string) {
        return this.prisma.parentalApproval.findMany({
            where: { childId },
            orderBy: { at: 'desc' },
        });
    }

    async findPendingByOwner(ownerId: string) {
        return this.prisma.parentalApproval.findMany({
            where: {
                child: {
                    parentId: ownerId,
                },
                status: 'Pending',
            },
            orderBy: { at: 'desc' },
        });
    }

    async updateStatus(id: string, status: string) {
        return this.prisma.parentalApproval.update({
            where: { id },
            data: { status },
        });
    }

    async findOneById(id: string) {
        return this.prisma.parentalApproval.findUnique({
            where: { id },
            include: { child: true },
        });
    }
}
