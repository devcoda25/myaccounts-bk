import { Controller, Post, Body, BadRequestException, Res, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { SocialAuthService } from '../../services/auth/social-auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SocialLoginDto } from '../../common/dto/auth/social-login.dto';

import { LocationService } from '../../services/users/location.service';
import { UserManagementService } from '../../services/users/user-management.service';

@Controller('auth')
export class SocialLoginController {
    constructor(
        private socialAuthService: SocialAuthService,
        private locationService: LocationService,
        private userManagementService: UserManagementService
    ) { }

    @Post('google')
    async googleLogin(@Body() body: SocialLoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        if (!body.token) throw new BadRequestException('Token is required');

        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const location = this.locationService.getLocation(ip);

        const deviceInfo = {
            ip: ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown',
            browser: 'Unknown',
            location: location
        };

        const result = await this.socialAuthService.socialLogin('google', body.token, deviceInfo);

        if (location && result.user) {
            await this.userManagementService.updateProfile(result.user.id, { lastLocation: location } as any);
        }

        this.setCookie(res, result.access_token);
        return result;
    }

    @Post('apple')
    async appleLogin(@Body() body: SocialLoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        if (!body.token) throw new BadRequestException('Token is required');

        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const location = this.locationService.getLocation(ip);

        const deviceInfo = {
            ip: ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown',
            browser: 'Unknown',
            location: location
        };

        const result = await this.socialAuthService.socialLogin('apple', body.token, deviceInfo);

        if (location && result.user) {
            await this.userManagementService.updateProfile(result.user.id, { lastLocation: location } as any);
        }

        this.setCookie(res, result.access_token);
        return result;
    }

    private setCookie(res: FastifyReply, token: string) {
        res.setCookie('evzone_token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24h
        });
    }

    @Post('link/google')
    @UseGuards(AuthGuard)
    async linkGoogle(@Req() req: AuthRequest, @Body() body: SocialLoginDto) {
        return this.socialAuthService.linkAccount(req.user.sub, 'google', body.token);
    }

    @Post('link/apple')
    @UseGuards(AuthGuard)
    async linkApple(@Req() req: AuthRequest, @Body() body: SocialLoginDto) {
        return this.socialAuthService.linkAccount(req.user.sub, 'apple', body.token);
    }
}
