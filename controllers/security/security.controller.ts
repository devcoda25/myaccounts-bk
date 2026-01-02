import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SecurityService } from '../../services/security/security.service';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
    constructor(private securityService: SecurityService) { }

    @Get('overview')
    async getOverview(@Request() req: any) {
        const userId = req.user.sub;
        return this.securityService.getOverview(userId);
    }

    @Get('activity')
    async getActivity(@Request() req: any) {
        const userId = req.user.sub;
        return this.securityService.getActivity(userId);
    }
}
