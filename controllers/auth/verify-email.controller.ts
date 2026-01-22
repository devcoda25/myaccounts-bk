import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { VerificationService } from '../../services/auth/verification.service';
import { LoginService } from '../../services/auth/login.service';
import { VerifyEmailDto } from '../../common/dto/auth/verify-email.dto';

@Controller('auth')
export class VerifyEmailController {
    constructor(
        private verificationService: VerificationService,
        private loginService: LoginService
    ) { }

    @Post('verify-email')
    async verifyEmail(@Body() body: VerifyEmailDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        const result = await this.verificationService.verifyEmail(body.identifier, body.code);

        if (result.user) {
            // Create Session
            const deviceInfo = {
                ip: req.ip,
                device: req.headers['user-agent'] || 'Unknown',
                os: 'Unknown',
                browser: 'Unknown',
            };

            const tokens = await this.loginService.generateSessionToken(result.user, deviceInfo);

            // Access Token Cookie (Short-Lived, None for Cross-Site)
            res.setCookie('evzone_token', tokens.access_token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 15 * 60, // 15m
            });

            // Refresh Token Cookie (Long-Lived, Strict, Scoped)
            res.setCookie('refresh_token', tokens.refresh_token, {
                path: '/api/v1/auth/refresh',
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60, // 7d
            });

            return { success: true, access_token: tokens.access_token, expires_in: tokens.expires_in };
        }

        return { success: true };
    }

    @Post('request-email-verification')
    async requestEmailVerification(@Body() body: { email: string }) {
        return this.verificationService.requestVerification(body.email, 'EMAIL_VERIFY', 'email_link');
    }
}
