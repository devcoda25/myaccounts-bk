import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DeveloperService } from '../../services/developer/developer.service';
import { EdgeGuardMiddleware } from '../../middleware/edge-guard.middleware'; // If we want to use guards

@Controller('developer')
export class DeveloperController {
    constructor(private readonly developerService: DeveloperService) { }

    @Get('api-keys')
    async getApiKeys(@Request() req: any) {
        const userId = req.user?.id || 'demo-user-id'; // Replaced with actual user ID from req.user
        return this.developerService.getApiKeys(userId);
    }

    @Post('api-keys')
    async createApiKey(@Request() req: any, @Body() body: { name: string; scopes: string[] }) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.createApiKey(userId, body.name, body.scopes);
    }

    @Delete('api-keys/:id')
    async revokeApiKey(@Request() req: any, @Param('id') id: string) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.revokeApiKey(userId, id);
    }

    @Get('oauth-clients')
    async getOAuthClients(@Request() req: any) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.getOAuthClients(userId);
    }

    @Post('oauth-clients')
    async createOAuthClient(@Request() req: any, @Body() body: { name: string; type: 'confidential' | 'public'; redirectUris: string[] }) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.createOAuthClient(userId, body);
    }

    @Delete('oauth-clients/:id')
    async revokeOAuthClient(@Request() req: any, @Param('id') id: string) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.revokeOAuthClient(userId, id);
    }

    @Get('audit-logs')
    async getAuditLogs(@Request() req: any) {
        const userId = req.user?.id || 'demo-user-id';
        return this.developerService.getDeveloperAuditLogs(userId);
    }
}
