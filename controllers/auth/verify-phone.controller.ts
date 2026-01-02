import { Controller, Post, Body, Res, Req, InternalServerErrorException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { VerificationService } from '../../services/auth/verification.service';
import { LoginService } from '../../services/auth/login.service';
import { VerifyPhoneDto } from '../../common/dto/verify-phone.dto';
import { RequestPhoneVerificationDto } from '../../common/dto/request-phone-verification.dto';

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

            // Set HttpOnly Cookie
            res.setCookie('access_token', tokens.access_token, {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60, // 24h
            });

            return { success: true };
        }

        return { success: true };
    }

    @Post('request-phone-verification')
    async requestPhoneVerification(@Body() body: RequestPhoneVerificationDto) {
        return this.verificationService.requestVerification(body.identifier, 'PHONE_VERIFY', body.deliveryMethod || 'sms_code');
    }
}
