import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminDisputesRepository } from '../../repos/admin/admin-disputes.repository';

@Injectable()
export class AdminDisputesService {
    constructor(private repo: AdminDisputesRepository) { }

    async getDisputes(query: string, status: string, skip: number, take: number) {
        const where: any = {};

        if (status && status !== 'All') {
            where.status = status;
        }

        if (query) {
            where.OR = [
                { id: { contains: query, mode: 'insensitive' } },
                { reference: { contains: query, mode: 'insensitive' } },
                { txnId: { contains: query, mode: 'insensitive' } },
            ];
        }

        const [disputes, total] = await Promise.all([
            this.repo.findAll({
                skip,
                take,
                where,
                orderBy: { updatedAt: 'desc' }
            }),
            this.repo.count(where)
        ]);

        return { disputes, total };
    }

    async getDispute(id: string) {
        const dispute = await this.repo.findOne(id);
        if (!dispute) throw new NotFoundException('Dispute not found');
        return dispute;
    }

    async resolveDispute(id: string, decision: 'WON' | 'LOST', notes?: string) {
        const dispute = await this.repo.findOne(id);
        if (!dispute) throw new NotFoundException('Dispute not found');

        // Here we might want to also trigger money movement (refund or freeze release)
        // For now, we just update status.

        return this.repo.update(id, {
            status: decision,
            // If we had a notes field or resolution notes, we'd save them here
        });
    }

    async addEvidence(id: string, fileData: any) {
        return this.repo.addEvidence(id, {
            name: fileData.originalname,
            url: fileData.path, // In real app, upload to S3/Cloudinary and get URL
            size: fileData.size,
            mimeType: fileData.mimetype,
            uploadedBy: 'ADMIN'
        });
    }
}
