import { Injectable } from '@nestjs/common';
import { WalletFindRepository } from '../../repos/wallet/wallet-find.repository';
import { WalletCreateRepository } from '../../repos/wallet/wallet-create.repository';

@Injectable()
export class WalletCoreService {
    constructor(
        private walletFindRepo: WalletFindRepository,
        private walletCreateRepo: WalletCreateRepository
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
}
