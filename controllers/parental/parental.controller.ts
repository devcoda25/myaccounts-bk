import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ParentalService } from '../../services/parental/parental.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { LinkChildDto, UpdateHouseholdModeDto, DecideApprovalDto, CreateChildDto, UpdateChildDto } from '../../common/dto/parental/parental.dto';

@Controller('parental')
@UseGuards(AuthGuard, RolesGuard)
export class ParentalController {
    constructor(private readonly parentalService: ParentalService) { }

    // --- Children ---
    @Get('children')
    async getChildren(@CurrentUser() user: AuthRequest['user']) {
        return this.parentalService.getChildren(user.sub || (user as any).id);
    }

    @Post('children/create')
    async createChild(@CurrentUser() user: AuthRequest['user'], @Body() body: CreateChildDto) {
        return this.parentalService.createChild(user.sub || (user as any).id, body);
    }

    @Post('children/link')
    async linkChild(@CurrentUser() user: AuthRequest['user'], @Body() body: LinkChildDto) {
        return this.parentalService.linkChild(user.sub || (user as any).id, body.code);
    }

    @Patch('children/:id')
    async updateChild(@Param('id') id: string, @Body() body: UpdateChildDto) {
        const { patch, audit } = body;
        return this.parentalService.updateChild(id, patch, audit);
    }

    // --- Household ---
    @Get('household')
    async getHousehold(@CurrentUser() user: AuthRequest['user']) {
        return this.parentalService.getHousehold(user.sub || (user as any).id);
    }

    @Patch('household/mode')
    async updateHouseholdMode(@CurrentUser() user: AuthRequest['user'], @Body() body: UpdateHouseholdModeDto) {
        return this.parentalService.updateHouseholdMode(user.sub || (user as any).id, body.mode);
    }

    @Post('household/members')
    async inviteMember(@CurrentUser() user: AuthRequest['user'], @Body() body: any) {
        return this.parentalService.inviteMember(user.sub || (user as any).id, body);
    }

    @Delete('household/members/:id')
    async removeMember(@Param('id') id: string) {
        return this.parentalService.removeMember(id);
    }

    // --- Approvals ---
    @Get('approvals')
    async getApprovals(@CurrentUser() user: AuthRequest['user']) {
        return this.parentalService.getApprovals(user.sub || (user as any).id);
    }

    @Post('approvals/:id/decide')
    async decideApproval(@Param('id') id: string, @Body() body: DecideApprovalDto) {
        return this.parentalService.decideApproval(id, body.approve);
    }

    // --- Activity ---
    @Get('activity')
    async getActivity(@CurrentUser() user: AuthRequest['user']) {
        return this.parentalService.getActivity(user.sub || (user as any).id);
    }
}
