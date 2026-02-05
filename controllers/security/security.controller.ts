import { Controller, Post, Body, UseGuards, Ip, Req, Get } from '@nestjs/common';
import { SecurityService } from '../../services/security/security.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
    constructor(private service: SecurityService) { }

    @Get('overview')
    async getOverview(@CurrentUser() user: AuthRequest['user']) {
        // Return a comprehensive security overview for the frontend
        return {
            password: {
                lastChangedDays: 0, // TODO: Get from user service
                strength: 0, // TODO: Calculate from password rules
                compromised: false
            },
            mfa: {
                enabled: false, // TODO: Get from MFA service
                methods: [],
                recoveryCodesRemaining: 0
            },
            passkeys: {
                enabled: false, // TODO: Get from passkeys service
                count: 0
            },
            recovery: {
                verifiedEmails: 1,
                verifiedPhones: 0
            }
        };
    }

    @Get('activity')
    async getActivities(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getActivityLogs(user.id);
    }

    @Post('reports')
    async report(@CurrentUser() user: AuthRequest['user'], @Body() body: { type: string, reason: string, details: string }, @Ip() ip: string) {
        return this.service.reportIncident(user.id, { ...body, ip });
    }

    @Post('lock')
    async lock(@CurrentUser() user: AuthRequest['user'], @Ip() ip: string) {
        return this.service.lockAccount(user.id, ip);
    }
}
