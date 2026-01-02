import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../../services/organizations/organization.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orgs')
export class OrganizationController {
    constructor(private service: OrganizationService) { }

    @Get()
    @UseGuards(AuthGuard)
    async listMyOrgs(@CurrentUser() user: any) {
        return this.service.getUserOrgs(user.sub || user.id);
    }

    @Post()
    @UseGuards(AuthGuard)
    async create(@CurrentUser() user: any, @Body() body: { name: string; country?: string }) {
        return this.service.createOrg(user.sub || user.id, body);
    }

    @Get(':id')
    @UseGuards(AuthGuard)
    async get(@Param('id') id: string, @CurrentUser() user: any) {
        return this.service.getOrg(id, user.sub || user.id);
    }

    @Post(':id/join')
    @UseGuards(AuthGuard)
    async join(@CurrentUser() user: any, @Param('id') id: string) {
        return this.service.joinOrg(user.sub || user.id, id);
    }

    // --- Settings ---
    @Patch(':id')
    @UseGuards(AuthGuard)
    async updateSettings(@Param('id') id: string, @Body() body: any) {
        return this.service.updateSettings(id, body);
    }

    // --- Members ---
    @Get(':id/members')
    @UseGuards(AuthGuard)
    async getMembers(@Param('id') id: string) {
        return this.service.getMembers(id);
    }

    @Patch(':id/members/:userId')
    @UseGuards(AuthGuard)
    async updateMemberRole(@Param('id') id: string, @Param('userId') userId: string, @Body() body: { role: string }) {
        return this.service.updateMemberRole(id, userId, body.role);
    }

    @Delete(':id/members/:userId')
    @UseGuards(AuthGuard)
    async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        return this.service.removeMember(id, userId);
    }

    // --- Invites ---
    @Get(':id/invites')
    @UseGuards(AuthGuard)
    async getInvites(@Param('id') id: string) {
        return this.service.getInvites(id);
    }

    @Post(':id/invites')
    @UseGuards(AuthGuard)
    async createInvite(@Param('id') id: string, @Body() body: { email: string; role: string }) {
        return this.service.createInvite(id, body.email, body.role);
    }

    @Delete(':id/invites/:inviteId')
    @UseGuards(AuthGuard)
    async revokeInvite(@Param('inviteId') inviteId: string) {
        return this.service.revokeInvite(inviteId);
    }

    // --- Domains ---
    @Get(':id/domains')
    @UseGuards(AuthGuard)
    async getDomains(@Param('id') id: string) {
        return this.service.getDomains(id);
    }

    @Post(':id/domains')
    @UseGuards(AuthGuard)
    async addDomain(@Param('id') id: string, @Body() body: { domain: string }) {
        return this.service.addDomain(id, body.domain);
    }

    @Post(':id/domains/:domainId/verify')
    @UseGuards(AuthGuard)
    async verifyDomain(@Param('domainId') domainId: string) {
        return this.service.verifyDomain(domainId);
    }

    @Patch(':id/domains/:domainId')
    @UseGuards(AuthGuard)
    async updateDomain(@Param('domainId') domainId: string, @Body() body: any) {
        return this.service.updateDomain(domainId, body);
    }

    @Delete(':id/domains/:domainId')
    @UseGuards(AuthGuard)
    async removeDomain(@Param('domainId') domainId: string) {
        return this.service.removeDomain(domainId);
    }

    // --- SSO ---
    @Get(':id/sso')
    @UseGuards(AuthGuard)
    async getSSO(@Param('id') id: string) {
        return this.service.getSSO(id);
    }

    @Put(':id/sso')
    @UseGuards(AuthGuard)
    async updateSSO(@Param('id') id: string, @Body() body: any) {
        return this.service.updateSSO(id, body);
    }
}
