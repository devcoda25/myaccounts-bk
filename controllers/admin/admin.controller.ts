import { Controller, Get, Post, Query, UseGuards, Param, NotFoundException, Body, Delete } from '@nestjs/common';
import { AdminService } from '../../services/admin/admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueryDto } from '../../common/dto/admin/admin.dto';

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

    // Orgs, Wallets, and Transactions endpoints removed as they are moved to separate apps

    @Get('members')
    async getMembers() {
        return this.adminService.getAdmins();
    }

    @Post('members')
    async inviteMember(@Body() body: { email: string; role: string }) {
        return this.adminService.inviteAdmin(body.email, body.role);
    }

    @Delete('members/:id')
    async removeMember(@Param('id') id: string) {
        return this.adminService.removeAdmin(id);
    }
}
