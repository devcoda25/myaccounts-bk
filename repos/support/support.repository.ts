import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SupportRepository {
    constructor(private readonly prisma: PrismaService) { }

    // NOTE: Using 'any' because Prisma client types are not yet visible to the IDE.
    async createSecurityReport(data: Prisma.SecurityReportCreateInput) {
        return this.prisma.securityReport.create({
            data
        });
    }

    async createSupportTicket(data: Prisma.SupportTicketCreateInput) {
        return this.prisma.supportTicket.create({
            data
        });
    }

    async findUserTickets(userId: string) {
        return this.prisma.supportTicket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findUserReports(userId: string) {
        return this.prisma.securityReport.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
