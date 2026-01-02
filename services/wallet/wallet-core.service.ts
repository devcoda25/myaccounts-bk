import { Injectable } from '@nestjs/common';
import { WalletFindRepository } from '../../repos/wallet/wallet-find.repository';
import { WalletCreateRepository } from '../../repos/wallet/wallet-create.repository';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';

@Injectable()
export class WalletCoreService {
    constructor(
        private walletFindRepo: WalletFindRepository,
        private walletCreateRepo: WalletCreateRepository,
        private txFindRepo: TransactionFindRepository
    ) { }

    async getWallet(userId: string) {
        let wallet = await this.walletFindRepo.findByUserId(userId);
        if (!wallet) {
            wallet = await this.walletCreateRepo.create({
                user: { connect: { id: userId } },
                currency: 'UGX', // Default currency
                balance: 0,
            });
        }
        return wallet;
    }

    async getStats(userId: string) {
        const wallet = await this.getWallet(userId);
        return this.walletFindRepo.getStats(wallet.id);
    }

    async getTransactions(userId: string, query: any) {
        const wallet = await this.getWallet(userId);
        return this.txFindRepo.findTransactions(wallet.id, {
            take: query.take ? Number(query.take) : 5,
            skip: query.skip ? Number(query.skip) : 0,
            type: query.type,
            status: query.status,
            search: query.search
        });
    }
}
