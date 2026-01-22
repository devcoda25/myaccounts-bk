import { Injectable } from '@nestjs/common';
import { SupportRepository } from '../../repos/support/support.repository';
import { CreateSecurityReportDto } from '../../common/dto/support/create-security-report.dto';
import { CreateSupportTicketDto } from '../../common/dto/support/create-support-ticket.dto';

@Injectable()
export class SupportService {
    constructor(private readonly repo: SupportRepository) { }

    async createSecurityReport(userId: string, dto: CreateSecurityReportDto) {
        return this.repo.createSecurityReport({
            userId,
            type: dto.type,
            description: dto.description,
            metadata: dto.metadata || {}
        } as any);
    }

    async createSupportTicket(userId: string | null, dto: CreateSupportTicketDto) {
        return this.repo.createSupportTicket({
            userId,
            subject: dto.subject,
            description: dto.description,
            category: dto.category,
            metadata: dto.metadata || {}
        } as any);
    }

    async getUserActivity(userId: string) {
        const [tickets, reports] = await Promise.all([
            this.repo.findUserTickets(userId),
            this.repo.findUserReports(userId)
        ]);
        return { tickets, reports };
    }
}
