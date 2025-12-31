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
}
