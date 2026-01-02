import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PasskeysService } from '../../services/auth/passkeys.service';
import { SessionRepository } from '../../repos/auth/session.repository';

@Controller('auth/passkeys')
@UseGuards(AuthGuard)
export class PasskeysController {
    constructor(
        private passkeysService: PasskeysService,
        private sessionRepo: SessionRepository
    ) { }

    @Get()
    async list(@Request() req: any) {
        return this.passkeysService.listPasskeys(req.user.sub);
    }

    @Post('register/start')
    async registerStart(@Request() req: any) {
        // We'd ideally need user email for metadata
        // In real app, fetch email from req.user or DB. req.user should have email if JWT claims have it.
        const options = await this.passkeysService.generateRegistrationOptions(req.user.sub, 'user@example.com');

        // Save challenge in session (securely in DB)
        if (req.user.jti) {
            await this.sessionRepo.updateSessionChallenge(req.user.jti, options.challenge);
        }

        return options;
    }

    @Post('register/finish')
    async registerFinish(@Request() req: any, @Body() body: any) {
        if (!req.user.jti) {
            throw new BadRequestException('Session required for passkey registration');
        }

        // Retrieve challenge from session
        const session = await this.sessionRepo.findSessionById(req.user.jti);
        if (!session || !session.passkeyChallenge) {
            throw new BadRequestException('Challenge expired or invalid');
        }

        const expectedChallenge = session.passkeyChallenge;

        const result = await this.passkeysService.verifyRegistration(req.user.sub, body, expectedChallenge);

        // Clear challenge
        await this.sessionRepo.updateSessionChallenge(req.user.jti, null);

        return result;
    }

    @Delete(':id')
    async delete(@Request() req: any, @Param('id') id: string) {
        return this.passkeysService.deletePasskey(req.user.sub, id);
    }
}
