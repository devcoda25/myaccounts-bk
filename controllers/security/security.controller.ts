import { Controller, Post, Body, UseGuards, Ip, Req } from '@nestjs/common';
import { SecurityService } from '../../services/security/security.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
    constructor(private service: SecurityService) { }

    @Post('reports')
    async report(@CurrentUser() user: AuthRequest['user'], @Body() body: { type: string, reason: string, details: string }, @Ip() ip: string) {
        return this.service.reportIncident(user.id, { ...body, ip });
    }

    @Post('lock')
    async lock(@CurrentUser() user: AuthRequest['user'], @Ip() ip: string) {
        return this.service.lockAccount(user.id, ip);
    }
}
