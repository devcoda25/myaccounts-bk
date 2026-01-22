import { Controller, Get, Post, Patch, Query, UseGuards, Param, NotFoundException, Body, Delete } from '@nestjs/common';
import { AdminService } from '../../services/admin/admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueryDto } from '../../common/dto/admin/admin.dto';
import { AdminCreateOAuthClientDto, AdminUpdateOAuthClientDto } from '../../common/dto/admin/admin-apps.dto';

@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN') // Protect all admin routes
export class AdminController {
    constructor(private adminService: AdminService) { }

    @Get('health')
    async getHealth() {
        return this.adminService.getSystemHealth();
    }

    @Get('stats')
    async getStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('audit-logs')
    async getAuditLogs(@Query() query: AdminQueryDto) {
        return this.adminService.getAuditLogs(query);
    }

    // --- User Management ---

    @Post('users/:id/revoke-sessions')
    async revokeUserSessions(@Param('id') id: string) {
        return this.adminService.revokeUserSessions(id);
    }

    @Post('users/:id/reset-password')
    async resetUserPassword(@Param('id') id: string, @Body() body: { password: string }) {
        return this.adminService.resetUserPassword(id, body.password);
    }

    // --- OAuth Clients ---

    @Get('apps')
    async getApps(@Query() query: { skip?: number; take?: number; query?: string }) {
        return this.adminService.getApps(query);
    }

    @Get('apps/:id')
    async getApp(@Param('id') id: string) {
        return this.adminService.getApp(id);
    }

    @Post('apps')
    async createApp(@Body() body: AdminCreateOAuthClientDto) {
        return this.adminService.createApp(body);
    }

    @Post('apps/:id/rotate-secret')
    async rotateSecret(@Param('id') id: string) {
        return this.adminService.rotateAppSecret(id);
    }

    // PATCH /admin/apps/:id is tricky if we don't have a dedicated PATCH decorator or if FE sends it.
    // NestJS supports @Patch
    // Let's add Patch import
    @Patch('apps/:id')
    async updateApp(@Param('id') id: string, @Body() body: AdminUpdateOAuthClientDto) {
        return this.adminService.updateApp(id, body);
    }

    @Delete('apps/:id')
    async deleteApp(@Param('id') id: string) {
        return this.adminService.deleteApp(id);
    }


    // --- Members ---

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

    // --- App Specific Members ---

    @Get('apps/:id/members')
    async getAppMembers(@Param('id') id: string) {
        return this.adminService.getAppMembers(id);
    }

    @Post('apps/:id/members')
    async addAppMember(@Param('id') id: string, @Body() body: { email: string; role: string }) {
        return this.adminService.inviteAppAdmin(id, body.email, body.role);
    }

    @Delete('apps/members/:membershipId')
    async removeAppMember(@Param('membershipId') membershipId: string) {
        return this.adminService.removeAppAdmin(membershipId);
    }
}
