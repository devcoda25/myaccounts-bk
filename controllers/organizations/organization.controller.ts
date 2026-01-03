import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../../services/organizations/organization.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateOrgDto, UpdateMemberRoleDto, CreateInviteDto, AddDomainDto, UpdateOrgSettingsDto, UpdateDomainDto, UpdateSSODto } from '../../common/dto/orgs/organization.dto';

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

    // ... members ...

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
