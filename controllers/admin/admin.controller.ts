import { Controller, Get, Post, Query, UseGuards, Param, NotFoundException, Body } from '@nestjs/common';
import { AdminService } from '../../services/admin/admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueryDto, UpdateWalletStatusDto } from '../../common/dto/admin/admin.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN') // Protect all admin routes
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('audit-logs')
    async getAuditLogs(@Query() query: AdminQueryDto) {
        return this.adminService.getAuditLogs(query);
    }

    @Get('orgs')
    async getOrgs(@Query() query: AdminQueryDto) {
        return this.adminService.getOrgs(query);
    }

    @Get('orgs/:id')
    async getOrg(@Param('id') id: string) {
        const org = await this.adminService.getOrg(id);
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    @Get('wallets')
    async getWallets(@Query() query: AdminQueryDto) {
        return this.adminService.getWallets(query);
    }

    @Get('wallets/stats')
    async getWalletStats() {
        return this.adminService.getWalletStats();
    }

    @Post('wallets/:id/status')
    async updateWalletStatus(@Param('id') id: string, @Body() body: UpdateWalletStatusDto) {
        return this.adminService.updateWalletStatus(id, body.action);
    }

    @Get('transactions')
    async getTransactions(@Query() query: AdminQueryDto) {
        return this.adminService.getTransactions(query);
    }
}
