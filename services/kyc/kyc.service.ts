import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { v4 as uuidv4 } from 'uuid';

export type KycStatus = 'Pending' | 'Verified' | 'Rejected' | 'In Review';

@Injectable()
export class KycService {
    constructor(private prisma: PrismaService) { }

    async getStatus(userId: string) {
        const record = await this.prisma.kycrecord.findUnique({ where: { userId } });
        if (!record) return { status: 'Unverified', tier: 'Unverified' };
        return {
            status: record.status,
            tier: record.status === 'Verified' ? (record.level === 2 ? 'Full' : 'Basic') : 'Unverified', // Simplified tier mapping
            notes: record.notes,
            submittedAt: record.submittedAt
        };
    }

    async submitKyc(userId: string, data: { slot: string, url: string }[], docType: string, level: number = 1) {
        // Upsert KYC record
        const record = await this.prisma.kycrecord.findUnique({ where: { userId } });

        // Block if already verified at the SAME or HIGHER level
        if (record && record.status === 'Verified') {
            if (record.level && record.level >= level) {
                throw new BadRequestException('Already verified at this level');
            }
            // Allow upgrade (e.g. level 1 -> 2)
        }

        // Map uploads to easy JSON
        const documents: any = record ? (record.documents as any || {}) : {};
        data.forEach(d => documents[d.slot] = d.url);

        return this.prisma.kycrecord.upsert({
            where: { userId },
            create: {
                userId,
                status: 'Pending',
                documents,
                docType,
                level
            },
            update: {
                status: 'Pending',
                documents, // Merges new docs with old ones if we used the logic above
                docType,   // Updates doc type (e.g. to "Proof of Address")
                level,     // Upgrades level
                submittedAt: new Date()
            }
        });
    }

    // Admin methods
    async getAllRequests(filters: { skip?: number, take?: number, status?: string, query?: string }) {
        const { skip = 0, take = 50, status, query } = filters;
        const where: any = {};

        if (status) {
            // handle "Verified" mappings if needed, or pass direct enum
            if (status === 'Pending Review') where.status = { in: ['Pending', 'In Review'] };
            else where.status = status;
        }

        if (query) {
            where.user = {
                OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ]
            };
        }

        const [records, total] = await Promise.all([
            this.prisma.kycrecord.findMany({
                where,
                skip,
                take,
                orderBy: { submittedAt: 'desc' },
                include: { user: { select: { id: true, firstName: true, otherNames: true, email: true, avatarUrl: true } } }
            }),
            this.prisma.kycrecord.count({ where })
        ]);

        return {
            requests: records.map(r => ({
                id: r.id,
                userId: r.user.id,
                userName: `${r.user.firstName || ''} ${r.user.otherNames || ''}`.trim() || 'Unknown',
                email: r.user.email,
                submittedAt: r.submittedAt.getTime(),
                docType: r.docType || 'Unknown',
                status: r.status,
                riskScore: r.riskScore,
                documents: r.documents
            })),
            total
        };
    }

    async reviewRequest(id: string, action: 'APPROVE' | 'REJECT', reason?: string) {
        const record = await this.prisma.kycrecord.findUnique({ where: { id } });
        if (!record) throw new NotFoundException('Request not found');

        if (action === 'APPROVE') {
            return this.prisma.kycrecord.update({
                where: { id },
                data: {
                    status: 'Verified',
                    verifiedAt: new Date(),
                    notes: reason // Optional notes
                }
            });
        } else {
            return this.prisma.kycrecord.update({
                where: { id },
                data: {
                    status: 'Rejected',
                    notes: reason
                }
            });
        }
    }
}
