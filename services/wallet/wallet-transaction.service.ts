import { Injectable, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';
import { TransactionCreateRepository } from '../../repos/wallet/transaction-create.repository';
import { WalletUpdateRepository } from '../../repos/wallet/wallet-update.repository';
import { WalletCoreService } from './wallet-core.service';
import { ApwgApiService } from '../../modules/payment/apwgapi.service';

import { CreateTransactionDto, TransactionQueryDto, FundWalletDto } from '../../common/dto/wallet/transaction.dto';

@Injectable()
export class WalletTransactionService {
    constructor(
        private txFindRepo: TransactionFindRepository,
        private txCreateRepo: TransactionCreateRepository,
        private walletUpdateRepo: WalletUpdateRepository,
        private walletCore: WalletCoreService,
        private apwgService: ApwgApiService
    ) { }

    async getHistory(userId: string, query: TransactionQueryDto) {
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

    async createTransaction(userId: string, data: CreateTransactionDto) {
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

    async deposit(userId: string, dto: FundWalletDto) {
        if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
        const wallet = await this.walletCore.getWallet(userId);

        // 1. Create Pending Transaction
        const ref = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tx = await this.txCreateRepo.createTransaction({
            wallet: { connect: { id: wallet.id } },
            amount: dto.amount,
            currency: dto.currency || wallet.currency,
            type: 'Top up',
            status: 'pending',
            referenceId: ref,
            channel: dto.method,
            providerRef: null,
            description: `Deposit via ${dto.method}`
        });

        // 2. Initiate Payment Gateway Charge
        try {
            const result = await this.apwgService.initiateDeposit({
                amount: dto.amount,
                currency: dto.currency || wallet.currency,
                referenceId: ref,
                provider: dto.provider || 'unknown',
                channel: dto.method,
                userDetails: { id: userId }, // Pass minimal user info
                redirectUrl: `https://evzone.com/wallet/verify/${ref}` // Config this properly in .env later
            });

            return {
                transaction: tx,
                paymentResult: result
            };
        } catch (error) {
            // Mark transaction as failed if initiation fails
            // await this.txUpdateRepo.updateStatus(tx.id, 'failed'); // repo method needed if we want strict consistency
            throw error;
        }
    }

    async withdraw(userId: string, dto: FundWalletDto) {
        if (dto.amount <= 0) throw new BadRequestException('Amount must be positive');
        const wallet = await this.walletCore.getWallet(userId);

        if (Number(wallet.balance) < dto.amount) {
            throw new BadRequestException('Insufficient funds');
        }

        // 1. Lock Funds (Update Balance immediately for withdrawal)
        // In some systems, you hold 'reserved' balance. Here we just deduct.
        await this.walletUpdateRepo.updateBalance(wallet.id, new Decimal(-dto.amount));

        // 2. Create Pending Transaction
        const ref = `WTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tx = await this.txCreateRepo.createTransaction({
            wallet: { connect: { id: wallet.id } },
            amount: -dto.amount,
            currency: dto.currency || wallet.currency,
            type: 'Withdrawal',
            status: 'pending',
            referenceId: ref,
            channel: dto.method,
            description: `Withdrawal to ${dto.method} (${dto.accountNumber})`
        });

        // 3. Initiate Payout
        try {
            const result = await this.apwgService.initiateWithdrawal({
                amount: dto.amount,
                currency: dto.currency || wallet.currency,
                referenceId: ref,
                provider: dto.provider || 'unknown',
                channel: dto.method,
                accountDetails: { number: dto.accountNumber }
            });

            return {
                transaction: tx,
                paymentResult: result
            };
        } catch (error) {
            // Refund balance if initiation fails? 
            // This needs a proper transaction manager or saga.
            // For now, simple throw. Logs will help manual reconciliation.
            throw error;
        }
    }
}
