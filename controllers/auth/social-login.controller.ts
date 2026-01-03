import { Controller, Post, Body, BadRequestException, Res, Req } from '@nestjs/common';
import { SocialAuthService } from '../../services/auth/social-auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SocialLoginDto } from '../../common/dto/auth/social-login.dto';

@Controller('auth')
export class SocialLoginController {
    constructor(private socialAuthService: SocialAuthService) { }

    @Post('google')
    async googleLogin(@Body() body: SocialLoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        if (!body.token) throw new BadRequestException('Token is required');

        const deviceInfo = {
            ip: req.ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown',
            browser: 'Unknown',
        };

        const result = await this.socialAuthService.socialLogin('google', body.token, deviceInfo);
        this.setCookie(res, result.access_token);
        return result;
    }

    @Post('apple')
    async appleLogin(@Body() body: SocialLoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        if (!body.token) throw new BadRequestException('Token is required');

        const deviceInfo = {
            ip: req.ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown',
            browser: 'Unknown',
        };

        const result = await this.socialAuthService.socialLogin('apple', body.token, deviceInfo);
        this.setCookie(res, result.access_token);
        return result;
    }

    private setCookie(res: FastifyReply, token: string) {
        res.setCookie('access_token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24h
        });
    }
}
