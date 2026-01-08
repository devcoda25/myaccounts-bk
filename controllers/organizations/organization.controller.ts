import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../../services/organizations/organization.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateOrgDto, UpdateMemberDto, CreateWalletDto, CreateInviteDto, AddDomainDto, UpdateOrgSettingsDto, UpdateDomainDto, UpdateSSODto, CreateRoleDto, UpdateRoleDto, UpdateOrgPermissionsDto } from '../../common/dto/orgs/organization.dto';

@Controller('orgs')
export class OrganizationController {
    constructor(private service: OrganizationService) { }

    @Get()
    @UseGuards(AuthGuard)
    async listMyOrgs(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getUserOrgs(user.sub);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@CurrentUser() user: AuthRequest['user'], @Body() body: CreateOrgDto) {
        return this.service.createOrg(user.sub, body);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async get(@Param('id') id: string, @CurrentUser() user: AuthRequest['user']) {
        return this.service.getOrg(id, user.sub);
    }

    @Post(':id/join')
    @UseGuards(AuthGuard)
    async join(@CurrentUser() user: AuthRequest['user'], @Param('id') id: string) {
        return this.service.joinOrg(user.sub, id);
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
    async updatePermissions(@Param('id') id: string, @Body() body: UpdateOrgPermissionsDto) {
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
        return this.service.updateSSO(id, body);
    }

    // --- Invites ---
    @Post(':id/invites')
    @UseGuards(AuthGuard)
    async createInvite(@Param('id') id: string, @Body() body: CreateInviteDto, @CurrentUser() user: AuthRequest['user']) {
        return this.service.createInvite(id, body.email, body.role, user.sub);
    }

    @Get(':id/invites')
    @UseGuards(AuthGuard)
    async getInvites(@Param('id') id: string) {
        return this.service.getInvites(id);
    }

    @Delete(':id/invites/:inviteId')
    @UseGuards(AuthGuard)
    async revokeInvite(@Param('inviteId') inviteId: string) {
        return this.service.revokeInvite(inviteId);
    }

    // --- Custom Roles ---
    @Post(':id/roles')
    @UseGuards(AuthGuard)
    async createRole(@Param('id') id: string, @Body() body: CreateRoleDto) {
        return this.service.createRole(id, body);
    }

    @Get(':id/roles')
    @UseGuards(AuthGuard)
    async getRoles(@Param('id') id: string) {
        return this.service.getRoles(id);
    }

    @Patch(':id/roles/:roleId')
    @UseGuards(AuthGuard)
    async updateRole(@Param('id') id: string, @Param('roleId') roleId: string, @Body() body: UpdateRoleDto) {
        return this.service.updateRole(id, roleId, body);
    }

    @Delete(':id/roles/:roleId')
    @UseGuards(AuthGuard)
    async deleteRole(@Param('id') id: string, @Param('roleId') roleId: string) {
        return this.service.deleteRole(id, roleId);
    }
}
