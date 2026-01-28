import { Controller, Post, Body, BadRequestException, Res, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { SocialAuthService } from '../../services/auth/social-auth.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { SocialLoginDto } from '../../common/dto/auth/social-login.dto';
import { Inject } from '@nestjs/common';
import Provider from 'oidc-provider';
import { OIDC_PROVIDER } from '../../modules/auth/oidc.constants';

import { LocationService } from '../../services/users/location.service';
import { UserManagementService } from '../../services/users/user-management.service';

@Controller('auth')
export class SocialLoginController {
    constructor(
        @Inject(OIDC_PROVIDER) private provider: Provider,
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

        // [Phase 25] Finish OIDC Interaction if UID is present
        if (body.uid) {
            console.log(`[SocialLogin] Finishing OIDC Interaction ${body.uid} for user ${result.user.id}`);
            const interactionResult = {
                login: { accountId: result.user.id },
            };
            // interactionFinished will set headers for redirection. 
            // Since we are returning the response, NestJS/Fastify will send it.
            return await this.provider.interactionFinished(req.raw, res.raw, interactionResult, { mergeWithLastSubmission: false });
        }

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

        // [Phase 25] Finish OIDC Interaction if UID is present
        if (body.uid) {
            console.log(`[SocialLogin] Finishing OIDC Interaction ${body.uid} for Apple user ${result.user.id}`);
            const interactionResult = {
                login: { accountId: result.user.id },
            };
            return await this.provider.interactionFinished(req.raw, res.raw, interactionResult, { mergeWithLastSubmission: false });
        }

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
