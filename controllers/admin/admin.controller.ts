import { Controller, Get, Post, Query, UseGuards, Param, NotFoundException, Body, Patch } from '@nestjs/common';
import { AdminService } from '../../services/admin/admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

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
    async getAuditLogs(@Query() query: any) {
        return this.adminService.getAuditLogs(query);
    }

    @Get('orgs')
    async getOrgs(@Query() query: { skip?: number; take?: number; query?: string; status?: string }) {
        return this.adminService.getOrgs(query);
    }

    @Get('orgs/:id')
    async getOrg(@Param('id') id: string) {
        const org = await this.adminService.getOrg(id);
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    @Get('wallets')
    async getWallets(@Query() query: any) {
        return this.adminService.getWallets(query);
    }

    @Get('wallets/stats')
    async getWalletStats() {
        return this.adminService.getWalletStats();
    }

    @Post('wallets/:id/status')
    async updateWalletStatus(@Param('id') id: string, @Body() body: { action: 'FREEZE' | 'UNFREEZE' }) {
        return this.adminService.updateWalletStatus(id, body.action);
    }

    @Get('transactions')
    async getTransactions(@Query() query: any) {
        return this.adminService.getTransactions(query);
    }
}
