import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdminDisputesRepository } from '../../repos/admin/admin-disputes.repository';
import { WalletCoreService } from '../wallet/wallet-core.service';

@Injectable()
export class UserDisputesService {
    constructor(
        private repo: AdminDisputesRepository,
        private walletCore: WalletCoreService
    ) { }

    async createDispute(userId: string, data: { txnId?: string, amount: number, currency: string, reason: string, description: string }) {
        const wallet = await this.walletCore.getWallet(userId);

        // In a real app, verify txnId belongs to this wallet

        const disputeData: any = {
            wallet: { connect: { id: wallet.id } },
            amount: data.amount,
            currency: data.currency,
            reason: data.reason,
            description: data.description,
            reference: `DSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'OPEN'
        };

        if (data.txnId) {
            disputeData.transaction = { connect: { id: data.txnId } };
        }

        return this.repo.create(disputeData);
    }

    async getMyDisputes(userId: string) {
        const wallet = await this.walletCore.getWallet(userId);
        return this.repo.findAll({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' }
        });
    }

    async addEvidence(userId: string, disputeId: string, fileData: any) {
        const wallet = await this.walletCore.getWallet(userId);
        const dispute = await this.repo.findOne(disputeId);

        if (!dispute || dispute.walletId !== wallet.id) {
            throw new NotFoundException('Dispute not found');
        }

        return this.repo.addEvidence(disputeId, {
            name: fileData.originalname,
            url: fileData.path,
            size: fileData.size,
            mimeType: fileData.mimetype,
            uploadedBy: 'USER'
        });
    }
}
