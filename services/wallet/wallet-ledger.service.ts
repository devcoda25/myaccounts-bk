import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma, Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class WalletLedgerService {
    constructor(private prisma: PrismaService) { }

    /**
     * Executes a wallet transaction atomically.
     * 1. Updates wallet balance with a strictly enforced minimum boundary.
     * 2. Creates a ledger entry (Transaction record).
     * All within a single DB transaction.
     */
    async executeAtomicTransfer(
        walletId: string,
        amount: Decimal,
        txData: Omit<Prisma.TransactionCreateInput, 'wallet'>,
        minBalance: Decimal = new Decimal(0)
    ): Promise<Transaction> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Atomic update with balance check
            try {
                await tx.wallet.update({
                    where: {
                        id: walletId,
                        balance: {
                            gte: minBalance.minus(amount)
                        }
                    },
                    data: {
                        balance: { increment: amount }
                    }
                });
            } catch (err) {
                // P2025: Record to update not found (either ID wrong or balance constraint failed)
                throw new BadRequestException('Transaction failed: Insufficient funds or wallet restricted');
            }

            // 2. Create ledger entry
            return tx.transaction.create({
                data: {
                    ...txData,
                    wallet: { connect: { id: walletId } }
                }
            });
        });
    }

    /**
     * Fulfills a pending deposit transaction.
     * Prevents double-fulfillment by checking current status.
     */
    async fulfillAtomicDeposit(
        referenceId: string,
        providerRef?: string
    ): Promise<Transaction> {
        return this.prisma.$transaction(async (tx) => {
            // 1. Find the transaction and its wallet
            const transaction = await tx.transaction.findFirst({
                where: { referenceId },
                include: { wallet: true }
            });

            if (!transaction) throw new BadRequestException('Transaction not found');
            if (transaction.status === 'completed') return transaction; // Idempotent
            if (transaction.status === 'failed') throw new BadRequestException('Cannot fulfill failed transaction');

            // 2. Update wallet balance
            await tx.wallet.update({
                where: { id: transaction.walletId },
                data: { balance: { increment: transaction.amount } }
            });

            // 3. Complete transaction
            return tx.transaction.update({
                where: { id: transaction.id },
                data: { status: 'completed', providerRef }
            });
        });
    }

    /**
     * Processes a direct debit (e.g. from an app).
     * Atomic balance check and deduction.
     */
    async processAtomicDebit(
        walletId: string,
        amount: Decimal,
        txData: Omit<Prisma.TransactionCreateInput, 'wallet'>
    ): Promise<Transaction> {
        // Debits are just transfers with minBalance = 0 or specific limit
        return this.executeAtomicTransfer(walletId, amount.abs().negated(), txData, new Decimal(0));
    }
}
