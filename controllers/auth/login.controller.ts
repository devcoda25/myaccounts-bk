import { Controller, Post, Body, UnauthorizedException, Res, Req, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoginService } from '../../services/auth/login.service';
import { LoginDto } from '../../common/dto/auth/login.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

import { LocationService } from '../../services/users/location.service';
import { UserManagementService } from '../../services/users/user-management.service';

@Controller('auth')
export class LoginController {
    constructor(
        private loginService: LoginService,
        private locationService: LocationService,
        private userManagementService: UserManagementService
    ) { }

    @Post('login')
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: AuthRequest) {
        const user = await this.loginService.validateUser(body.identifier, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const location = this.locationService.getLocation(ip);

        // Update User Location
        if (location) {
            // we do not await this to not block login? or we await to ensure consistency?
            // Await is safer for now.
            await this.userManagementService.updateProfile(user.id, { lastLocation: location } as any);
        }

        const deviceInfo = {
            ip: ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown', // Could parse using library
            browser: 'Unknown', // Could parse using library
            location: location // Add location to session device info too
        };

        const tokens = await this.loginService.generateSessionToken(user, deviceInfo);

        // 1. Access Token Cookie (Short-Lived, Lax)
        res.setCookie('evzone_token', tokens.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15m
        });

        // 2. Refresh Token Cookie (Long-Lived, Strict, Scoped)
        res.setCookie('refresh_token', tokens.refresh_token, {
            path: '/api/v1/auth/refresh', // Strict Scope
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60, // 7d
        });

        return { access_token: tokens.access_token, expires_in: tokens.expires_in };
    }

    @Post('refresh')
    async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

        const tokens = await this.loginService.refreshSession(refreshToken);

        // Rotate Cookies
        res.setCookie('evzone_token', tokens.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60,
        });

        res.setCookie('refresh_token', tokens.refresh_token, {
            path: '/api/v1/auth/refresh',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60,
        });

        return { access_token: tokens.access_token, expires_in: tokens.expires_in };
    }

    @Post('verify-password')
    @UseGuards(AuthGuard)
    async verifyPassword(@Req() req: AuthRequest, @Body() body: { password: string }) {
        const valid = await this.loginService.validatePassword(req.user.sub, body.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid password');
        }
        return { success: true };
    }
    @Post('logout')
    @UseGuards(AuthGuard)
    async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: FastifyReply) {
        if (req.user && req.user.jti) {
            await this.loginService.logout(req.user.jti).catch(() => { });
        }

        // Clear Cookies
        res.clearCookie('evzone_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });

        return { success: true };
    }
}
