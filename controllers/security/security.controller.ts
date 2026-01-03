import { Controller, Get, UseGuards, Request, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SecurityService } from '../../services/security/security.service';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
    constructor(private securityService: SecurityService) { }

    @Get('overview')
    async getOverview(@Req() req: AuthRequest) {
        const userId = req.user.sub;
        return this.securityService.getOverview(userId);
    }

    @Get('activity')
    async getActivity(@Req() req: AuthRequest) {
        const userId = req.user.sub;
        return this.securityService.getActivity(userId);
    }
}
