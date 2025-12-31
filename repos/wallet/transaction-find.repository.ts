import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, Transaction } from '@prisma/client';

@Injectable()
export class TransactionFindRepository {
    constructor(private prisma: PrismaService) { }

    async findTransactions(
        walletId: string,
        params: {
            skip?: number;
            take?: number;
            from?: Date;
            to?: Date;
            type?: string;
            status?: string;
            search?: string;
        }
    ): Promise<{ data: Transaction[]; total: number }> {
        const { skip, take, from, to, type, status, search } = params;

        const where: Prisma.TransactionWhereInput = {
            walletId,
            createdAt: {
                gte: from,
                lte: to,
            },
            type: type !== 'all' ? type : undefined,
            status: status !== 'all' ? status : undefined,
            OR: search
                ? [
                    { referenceId: { contains: search, mode: 'insensitive' } },
                    { providerRef: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
                : undefined,
        };

        const [data, total] = await Promise.all([
            this.prisma.transaction.findMany({
                where,
                skip: skip || 0,
                take: take || 50,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.transaction.count({ where }),
        ]);

        return { data, total };
    }
}
