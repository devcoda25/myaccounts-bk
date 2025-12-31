import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, Transaction } from '@prisma/client';

@Injectable()
export class TransactionCreateRepository {
    constructor(private prisma: PrismaService) { }

    async createTransaction(data: Prisma.TransactionCreateInput): Promise<Transaction> {
        return this.prisma.transaction.create({ data });
    }
}
