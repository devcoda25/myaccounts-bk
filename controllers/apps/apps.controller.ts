import { Controller, Get, Post, Delete, Param, UseGuards, Request, Req } from '@nestjs/common';
import { AppsService } from '../../services/apps/apps.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('apps')
@UseGuards(AuthGuard)
export class AppsController {
    constructor(private readonly appsService: AppsService) { }

    @Get()
    async getApps(@Req() req: AuthRequest) {
        return this.appsService.getApps(req.user.sub || (req.user as any).id);
    }

    @Get('permissions')
    async getPermissions(@Req() req: AuthRequest) {
        return this.appsService.getPermissions(req.user.sub || (req.user as any).id);
    }

    @Post(':id/revoke')
    async revokeAccess(@Req() req: AuthRequest, @Param('id') clientId: string) {
        return this.appsService.revokeAccess(req.user.sub || (req.user as any).id, clientId);
    }
}
