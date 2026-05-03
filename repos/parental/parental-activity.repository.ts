import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParentalActivityRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.ParentalActivityUncheckedCreateInput) {
        return this.prisma.parentalActivity.create({ data });
    }

    // ⚡ Bolt: Added composite index on [childId, at] to prevent in-memory sorts for chronological access
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
