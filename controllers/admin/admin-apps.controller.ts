import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from '../../services/admin/admin.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueryDto } from '../../common/dto/admin/admin.dto';
import { AdminCreateOAuthClientDto, AdminUpdateOAuthClientDto } from '../../common/dto/admin/admin-apps.dto';

@Controller('admin/apps')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminAppsController {
    constructor(private adminService: AdminService) { }

    @Get()
    async getApps(@Query() query: AdminQueryDto) {
        return this.adminService.getApps(query);
    }

    @Get(':id')
    async getApp(@Param('id') id: string) {
        return this.adminService.getApp(id);
    }

    @Post()
    async createApp(@Body() body: AdminCreateOAuthClientDto) {
        return this.adminService.createApp(body);
    }

    @Patch(':id')
    async updateApp(@Param('id') id: string, @Body() body: AdminUpdateOAuthClientDto) {
        return this.adminService.updateApp(id, body);
    }

    @Delete(':id')
    async deleteApp(@Param('id') id: string) {
        return this.adminService.deleteApp(id);
    }
}
