import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, Wallet } from '@prisma/client';

@Injectable()
export class WalletUpdateRepository {
    constructor(private prisma: PrismaService) { }

    async updateBalance(walletId: string, amount: Prisma.Decimal): Promise<Wallet> {
        return this.prisma.wallet.update({
            where: { id: walletId },
            data: { balance: { increment: amount } }
        });
    }

    /**
     * Updates balance ONLY if the resulting balance would be >= minBalance.
     * Uses atomic increment/decrement and Prisma's conditional update.
     * Returns the updated wallet, or throws if constraint fails.
     */
    async updateBalanceWithConstraint(walletId: string, amount: Prisma.Decimal, minBalance: Prisma.Decimal = new Prisma.Decimal(0)): Promise<Wallet> {
        // Condition: newBalance >= minBalance
        // oldBalance + amount >= minBalance  =>  oldBalance >= minBalance - amount

        const wallet = await this.prisma.wallet.update({
            where: {
                id: walletId,
                balance: {
                    gte: minBalance.minus(amount)
                }
            },
            data: { balance: { increment: amount } }
        });

        return wallet;
    }
}
