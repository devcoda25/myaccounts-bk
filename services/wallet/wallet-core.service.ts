import { Injectable } from '@nestjs/common';
import { WalletFindRepository } from '../../repos/wallet/wallet-find.repository';
import { WalletCreateRepository } from '../../repos/wallet/wallet-create.repository';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';

import { TransactionQueryDto } from '../../common/dto/wallet/transaction.dto';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class WalletCoreService {
    constructor(
        private walletFindRepo: WalletFindRepository,
        private walletCreateRepo: WalletCreateRepository,
        private txFindRepo: TransactionFindRepository,
        private kycService: KycService
    ) { }

    async getLimits(userId: string) {
        const kyc = await this.kycService.getStatus(userId);
        const tier = kyc.tier;

        const tiers: Record<string, { daily: number, monthly: number }> = {
            'Unverified': { daily: 1000000, monthly: 10000000 },
            'Basic': { daily: 5000000, monthly: 50000000 },
            'Full': { daily: 20000000, monthly: 200000000 }
        };

        const limits = tiers[tier] || tiers['Unverified'];

        return {
            tier,
            dailyLimit: limits.daily,
            monthlyLimit: limits.monthly,
            currency: 'UGX'
        };
    }

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

    async getTransactions(userId: string, query: TransactionQueryDto) {
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
