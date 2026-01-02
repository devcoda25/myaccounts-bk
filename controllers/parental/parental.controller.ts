import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ParentalService } from '../../services/parental/parental.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('parental')
@UseGuards(AuthGuard, RolesGuard)
export class ParentalController {
    constructor(private readonly parentalService: ParentalService) { }

    // --- Children ---
    @Get('children')
    async getChildren(@CurrentUser() user: any) {
        return this.parentalService.getChildren(user.sub || user.id);
    }

    @Post('children/create')
    async createChild(@CurrentUser() user: any, @Body() body: any) {
        return this.parentalService.createChild(user.sub || user.id, body);
    }

    @Post('children/link')
    async linkChild(@CurrentUser() user: any, @Body('code') code: string) {
        return this.parentalService.linkChild(user.sub || user.id, code);
    }

    @Patch('children/:id')
    async updateChild(@Param('id') id: string, @Body() body: any) {
        const { patch, audit } = body;
        return this.parentalService.updateChild(id, patch, audit);
    }

    // --- Household ---
    @Get('household')
    async getHousehold(@CurrentUser() user: any) {
        return this.parentalService.getHousehold(user.sub || user.id);
    }

    @Patch('household/mode')
    async updateHouseholdMode(@CurrentUser() user: any, @Body('mode') mode: string) {
        return this.parentalService.updateHouseholdMode(user.sub || user.id, mode);
    }

    @Post('household/members')
    async inviteMember(@CurrentUser() user: any, @Body() body: any) {
        return this.parentalService.inviteMember(user.sub || user.id, body);
    }

    @Delete('household/members/:id')
    async removeMember(@Param('id') id: string) {
        return this.parentalService.removeMember(id);
    }

    // --- Approvals ---
    @Get('approvals')
    async getApprovals(@CurrentUser() user: any) {
        return this.parentalService.getApprovals(user.sub || user.id);
    }

    @Post('approvals/:id/decide')
    async decideApproval(@Param('id') id: string, @Body('approve') approve: boolean) {
        return this.parentalService.decideApproval(id, approve);
    }

    // --- Activity ---
    @Get('activity')
    async getActivity(@CurrentUser() user: any) {
        return this.parentalService.getActivity(user.sub || user.id);
    }
}
