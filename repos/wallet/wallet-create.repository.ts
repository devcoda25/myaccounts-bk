import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, Wallet } from '@prisma/client';

@Injectable()
export class WalletCreateRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: Prisma.WalletCreateInput): Promise<Wallet> {
        return this.prisma.wallet.create({
            data,
        });
    }
}
