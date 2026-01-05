import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminDisputesRepository {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.DisputeWhereInput;
        orderBy?: Prisma.DisputeOrderByWithRelationInput;
    }) {
        const { skip, take, where, orderBy } = params;
        return this.prisma.dispute.findMany({
            skip,
            take,
            where,
            orderBy,
            include: {
                wallet: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { email: true, firstName: true, otherNames: true } }
                    }
                },
                evidence: true
            }
        });
    }

    async count(where: Prisma.DisputeWhereInput) {
        return this.prisma.dispute.count({ where });
    }

    async findOne(id: string) {
        return this.prisma.dispute.findUnique({
            where: { id },
            include: {
                wallet: {
                    select: {
                        id: true,
                        userId: true,
                        user: { select: { email: true, firstName: true, otherNames: true } }
                    }
                },
                transaction: true,
                evidence: true
            }
        });
    }

    async update(id: string, data: Prisma.DisputeUpdateInput) {
        return this.prisma.dispute.update({
            where: { id },
            data,
        });
    }

    async create(data: Prisma.DisputeCreateInput) {
        return this.prisma.dispute.create({
            data
        });
    }

    // For adding evidence from admin side
    async addEvidence(disputeId: string, data: { name: string, url: string, size: number, mimeType: string, uploadedBy: string }) {
        return this.prisma.disputeEvidence.create({
            data: {
                disputeId,
                ...data
            }
        });
    }
}
