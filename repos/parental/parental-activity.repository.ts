import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class ParentalActivityRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.parentalActivity.create({ data });
    }

    async findManyByChildId(childId: string, limit = 50) {
        return this.prisma.parentalActivity.findMany({
            where: { childId },
            orderBy: { at: 'desc' },
            take: limit,
        });
    }

    async findManyByOwner(ownerId: string, limit = 50) {
        return this.prisma.parentalActivity.findMany({
            where: {
                child: {
                    parentId: ownerId,
                },
            },
            orderBy: { at: 'desc' },
            take: limit,
        });
    }
}
