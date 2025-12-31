// Re-trigger TS check
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Wallet } from '@prisma/client';

@Injectable()
export class WalletFindRepository {
    constructor(private prisma: PrismaService) { }

    async findByUserId(userId: string): Promise<Wallet | null> {
        return this.prisma.wallet.findUnique({
            where: { userId },
        });
    }

    async getStats(walletId: string, days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const transactions = await this.prisma.transaction.findMany({
            where: {
                walletId,
                createdAt: { gte: since },
                status: 'completed',
            },
            select: {
                amount: true,
            },
        });

        let inflow = 0;
        let outflow = 0;

        for (const t of transactions) {
            const amount = Number(t.amount);
            if (amount > 0) inflow += amount;
            else outflow += Math.abs(amount);
        }

        return { inflow, outflow };
    }
}
