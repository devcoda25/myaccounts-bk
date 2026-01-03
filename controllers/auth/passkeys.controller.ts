import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, BadRequestException, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PasskeysService } from '../../services/auth/passkeys.service';
import { SessionRepository } from '../../repos/auth/session.repository';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('auth/passkeys')
@UseGuards(AuthGuard)
export class PasskeysController {
    constructor(
        private passkeysService: PasskeysService,
        private sessionRepo: SessionRepository
    ) { }

    @Get()
    async list(@Req() req: AuthRequest) {
        return this.passkeysService.listPasskeys(req.user.sub);
    }

    @Post('register/start')
    async registerStart(@Req() req: AuthRequest) {
        // We'd ideally need user email for metadata
        // In real app, fetch email from req.user or DB. req.user should have email if JWT claims have it.
        const options = await this.passkeysService.generateRegistrationOptions(req.user.sub, req.user.email || 'user@example.com');

        // Save challenge in session (securely in DB)
        if (req.user.jti) {
            await this.sessionRepo.updateSessionChallenge(req.user.jti, options.challenge);
        }

        return options;
    }

    @Post('register/finish')
    async registerFinish(@Req() req: AuthRequest, @Body() body: any) {
        // body is typically complex WebAuthn JSON, explicit typing requires @simplewebauthn/typescript-types or similar, ok to keep as any for now or basic Record<string,any>
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
    async delete(@Req() req: AuthRequest, @Param('id') id: string) {
        return this.passkeysService.deletePasskey(req.user.sub, id);
    }
}
