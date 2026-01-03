import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MfaService } from '../../services/auth/mfa.service';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { MfaVerificationDto } from '../../common/dto/auth/mfa.dto';

@Controller('auth/mfa')
@UseGuards(AuthGuard)
export class MfaController {
    constructor(private mfaService: MfaService) { }

    @Get('status')
    async getStatus(@Req() req: AuthRequest) {
        return this.mfaService.getStatus(req.user.sub);
    }

    @Post('setup/start')
    async startSetup(@Req() req: AuthRequest) {
        return this.mfaService.generateSecret(req.user.sub);
    }

    @Post('setup/verify')
    async verifySetup(@Req() req: AuthRequest, @Body() body: MfaVerificationDto) {
        return this.mfaService.verifyAndEnable(req.user.sub, body.token, body.secret);
    }

    @Post('disable')
    async disable(@Req() req: AuthRequest) {
        // In real world, require password re-auth here
        return this.mfaService.disable(req.user.sub);
    }

    @Post('recovery-codes')
    async regenerateCodes(@Req() req: AuthRequest) {
        return this.mfaService.regenerateRecoveryCodes(req.user.sub);
    }
}
