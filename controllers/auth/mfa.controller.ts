import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MfaService } from '../../services/auth/mfa.service';

@Controller('auth/mfa')
@UseGuards(AuthGuard)
export class MfaController {
    constructor(private mfaService: MfaService) { }

    @Get('status')
    async getStatus(@Request() req: any) {
        return this.mfaService.getStatus(req.user.sub);
    }

    @Post('setup/start')
    async startSetup(@Request() req: any) {
        return this.mfaService.generateSecret(req.user.sub);
    }

    @Post('setup/verify')
    async verifySetup(@Request() req: any, @Body() body: { token: string; secret: string }) {
        if (!body.token || !body.secret) throw new BadRequestException('Token and secret required');
        return this.mfaService.verifyAndEnable(req.user.sub, body.token, body.secret);
    }

    @Post('disable')
    async disable(@Request() req: any) {
        // In real world, require password re-auth here
        return this.mfaService.disable(req.user.sub);
    }

    @Post('recovery-codes')
    async regenerateCodes(@Request() req: any) {
        return this.mfaService.regenerateRecoveryCodes(req.user.sub);
    }
}
