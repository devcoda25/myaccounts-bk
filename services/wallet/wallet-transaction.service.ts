import { Injectable, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';
import { TransactionCreateRepository } from '../../repos/wallet/transaction-create.repository';
import { WalletUpdateRepository } from '../../repos/wallet/wallet-update.repository';
import { WalletCoreService } from './wallet-core.service';

@Injectable()
export class WalletTransactionService {
    constructor(
        private txFindRepo: TransactionFindRepository,
        private txCreateRepo: TransactionCreateRepository,
        private walletUpdateRepo: WalletUpdateRepository,
        private walletCore: WalletCoreService
    ) { }

    async getHistory(userId: string, query: any) {
        const wallet = await this.walletCore.getWallet(userId);

        return this.txFindRepo.findTransactions(wallet.id, {
            skip: query.skip ? Number(query.skip) : 0,
            take: query.take ? Number(query.take) : 50,
            from: query.from ? new Date(query.from) : undefined,
            to: query.to ? new Date(query.to) : undefined,
            type: query.type,
            status: query.status,
            search: query.search,
        });
    }

    async createTransaction(userId: string, data: any) {
        const wallet = await this.walletCore.getWallet(userId);

        return this.txCreateRepo.createTransaction({
            wallet: { connect: { id: wallet.id } },
            amount: data.amount,
            currency: wallet.currency,
            type: data.type,
            status: data.status,
            referenceId: data.reference,
            providerRef: data.providerRef,
            counterparty: data.counterparty,
            channel: data.channel,
            description: data.note
        });
    }

    async deposit(userId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');
        const wallet = await this.walletCore.getWallet(userId);

        // 1. Update Balance
        await this.walletUpdateRepo.updateBalance(wallet.id, new Decimal(amount));

        // 2. Create Transaction
        return this.txCreateRepo.createTransaction({
            wallet: { connect: { id: wallet.id } },
            amount: amount,
            currency: wallet.currency,
            type: 'Top up',
            status: 'completed',
            channel: 'Wallet',
            description: 'Add funds'
        });
    }

    async withdraw(userId: string, amount: number) {
        if (amount <= 0) throw new BadRequestException('Amount must be positive');
        const wallet = await this.walletCore.getWallet(userId);

        if (Number(wallet.balance) < amount) {
            throw new BadRequestException('Insufficient funds');
        }

        // 1. Update Balance
        await this.walletUpdateRepo.updateBalance(wallet.id, new Decimal(-amount));

        // 2. Create Transaction
        return this.txCreateRepo.createTransaction({
            wallet: { connect: { id: wallet.id } },
            amount: -amount,
            currency: wallet.currency,
            type: 'Withdrawal',
            status: 'completed', // In real app, this might be pending
            channel: 'Wallet',
            description: 'Withdrawal'
        });
    }
}
