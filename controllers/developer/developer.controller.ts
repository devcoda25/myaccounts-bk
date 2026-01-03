import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DeveloperService } from '../../services/developer/developer.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateApiKeyDto, CreateOAuthClientDto } from '../../common/dto/developer/developer.dto';

@Controller('developer')
@UseGuards(AuthGuard)
export class DeveloperController {
    constructor(private readonly developerService: DeveloperService) { }

    @Get('api-keys')
    async getApiKeys(@Req() req: AuthRequest) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.getApiKeys(userId);
    }

    @Post('api-keys')
    async createApiKey(@Req() req: AuthRequest, @Body() body: CreateApiKeyDto) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.createApiKey(userId, body.name, body.scopes);
    }

    @Delete('api-keys/:id')
    async revokeApiKey(@Req() req: AuthRequest, @Param('id') id: string) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.revokeApiKey(userId, id);
    }

    @Get('oauth-clients')
    async getOAuthClients(@Req() req: AuthRequest) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.getOAuthClients(userId);
    }

    @Post('oauth-clients')
    async createOAuthClient(@Req() req: AuthRequest, @Body() body: CreateOAuthClientDto) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.createOAuthClient(userId, body);
    }

    @Delete('oauth-clients/:id')
    async revokeOAuthClient(@Req() req: AuthRequest, @Param('id') id: string) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.revokeOAuthClient(userId, id);
    }

    @Get('audit-logs')
    async getAuditLogs(@Req() req: AuthRequest) {
        const userId = req.user.sub || (req.user as any).id;
        return this.developerService.getDeveloperAuditLogs(userId);
    }
}
