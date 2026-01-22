import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SupportService } from '../../services/support/support.service';
import { CreateSecurityReportDto } from '../../common/dto/support/create-security-report.dto';
import { CreateSupportTicketDto } from '../../common/dto/support/create-support-ticket.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('support')
export class SupportController {
    constructor(private readonly service: SupportService) { }

    @UseGuards(AuthGuard)
    @Post('security/reports')
    async reportSecurity(@CurrentUser() user: AuthRequest['user'], @Body() dto: CreateSecurityReportDto) {
        return this.service.createSecurityReport(user.id, dto);
    }

    @Post('tickets')
    async createTicket(@CurrentUser() user: AuthRequest['user'] | null, @Body() dto: CreateSupportTicketDto) {
        return this.service.createSupportTicket(user?.id || null, dto);
    }

    @UseGuards(AuthGuard)
    @Get('me/activity')
    async getMyActivity(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getUserActivity(user.id);
    }
}
