import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { SocialAuthService } from '../../services/auth/social-auth.service';

@Controller('auth')
export class SocialLoginController {
    constructor(private socialAuthService: SocialAuthService) { }

    @Post('google')
    async googleLogin(@Body() body: { token: string }) {
        if (!body.token) throw new BadRequestException('Token is required');
        return this.socialAuthService.socialLogin('google', body.token);
    }

    @Post('apple')
    async appleLogin(@Body() body: { token: string }) {
        if (!body.token) throw new BadRequestException('Token is required');
        return this.socialAuthService.socialLogin('apple', body.token);
    }
}
