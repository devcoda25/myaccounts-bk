import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../../services/organizations/organization.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateOrgDto, UpdateMemberDto, CreateWalletDto, CreateInviteDto, AddDomainDto, UpdateOrgSettingsDto, UpdateDomainDto, UpdateSSODto } from '../../common/dto/orgs/organization.dto';

@Controller('orgs')
export class OrganizationController {
    constructor(private service: OrganizationService) { }

    @Get()
    @UseGuards(AuthGuard)
    async listMyOrgs(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getUserOrgs(user.sub || (user as any).id);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@CurrentUser() user: AuthRequest['user'], @Body() body: CreateOrgDto) {
        return this.service.createOrg(user.sub || (user as any).id, body);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async get(@Param('id') id: string, @CurrentUser() user: AuthRequest['user']) {
        return this.service.getOrg(id, user.sub || (user as any).id);
    }

    @Post(':id/join')
    @UseGuards(AuthGuard)
    async join(@CurrentUser() user: AuthRequest['user'], @Param('id') id: string) {
        return this.service.joinOrg(user.sub || (user as any).id, id);
    }

    // --- Settings ---
    @Patch(':id')
    @UseGuards(AuthGuard)
    async updateSettings(@Param('id') id: string, @Body() body: UpdateOrgSettingsDto) {
        return this.service.updateSettings(id, body);
    }

    // --- Members ---
    @Get(':id/members')
    @UseGuards(AuthGuard)
    async listMembers(@Param('id') id: string) {
        return this.service.getMembers(id);
    }

    @Patch(':id/members/:userId')
    @UseGuards(AuthGuard)
    async updateMember(@Param('id') id: string, @Param('userId') userId: string, @Body() body: UpdateMemberDto) {
        return this.service.updateMember(id, userId, body);
    }

    @Delete(':id/members/:userId')
    @UseGuards(AuthGuard)
    async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.service.removeMember(id, userId);
    }

    // --- Wallet ---
    @Post(':id/wallet')
    @UseGuards(AuthGuard)
    async createWallet(@Param('id') id: string, @Body() body: CreateWalletDto) {
        return this.service.createOrgWallet(id, body.currency);
    }

    // --- Permissions ---
    @Get(':id/permissions')
    @UseGuards(AuthGuard)
    async getPermissions(@Param('id') id: string) {
        return this.service.getPermissions(id);
    }

    @Patch(':id/permissions')
    @UseGuards(AuthGuard)
    async updatePermissions(@Param('id') id: string, @Body() body: any) {
        return this.service.updatePermissions(id, body);
    }

    // --- Domains ---
    // ...

    @Patch(':id/domains/:domainId')
    @UseGuards(AuthGuard)
    async updateDomain(@Param('domainId') domainId: string, @Body() body: UpdateDomainDto) {
        return this.service.updateDomain(domainId, body);
    }

    // ... sso ...

    @Put(':id/sso')
    @UseGuards(AuthGuard)
    async updateSSO(@Param('id') id: string, @Body() body: UpdateSSODto) {
        return this.service.updateSSO(id, body as any); // Service expects specific shape, DTO valid
    }
}
