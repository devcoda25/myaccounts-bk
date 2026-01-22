import { Controller, Post, Body, Res, Req, InternalServerErrorException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { VerificationService } from '../../services/auth/verification.service';
import { LoginService } from '../../services/auth/login.service';
import { VerifyPhoneDto } from '../../common/dto/auth/verify-phone.dto';
import { RequestPhoneVerificationDto } from '../../common/dto/auth/request-phone-verification.dto';

@Controller('auth')
export class VerifyPhoneController {
    constructor(
        private verificationService: VerificationService,
        private loginService: LoginService
    ) { }

    @Post('verify-phone')
    async verifyPhone(@Body() body: VerifyPhoneDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        const result = await this.verificationService.verifyPhone(body.identifier, body.code);

        if (result.user) {
            // Create Session
            const deviceInfo = {
                ip: req.ip,
                device: req.headers['user-agent'] || 'Unknown',
                os: 'Unknown',
                browser: 'Unknown',
            };

            const tokens = await this.loginService.generateSessionToken(result.user, deviceInfo);

            // Access Token Cookie
            res.setCookie('evzone_token', tokens.access_token, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 15 * 60,
            });

            // Refresh Token Cookie
            res.setCookie('refresh_token', tokens.refresh_token, {
                path: '/api/v1/auth/refresh',
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60,
            });

            return { success: true, access_token: tokens.access_token, expires_in: tokens.expires_in };
        }

        return { success: true };
    }

    @Post('request-phone-verification')
    async requestPhoneVerification(@Body() body: RequestPhoneVerificationDto) {
        return this.verificationService.requestVerification(body.identifier, 'PHONE_VERIFY', body.deliveryMethod || 'sms_code');
    }
}
