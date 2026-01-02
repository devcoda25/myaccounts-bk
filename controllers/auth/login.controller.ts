import { Controller, Post, Body, UnauthorizedException, Res, Req } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoginService } from '../../services/auth/login.service';
import { LoginDto } from '../../common/dto/login.dto';

@Controller('auth')
export class LoginController {
    constructor(private loginService: LoginService) { }

    @Post('login')
    async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        const user = await this.loginService.validateUser(body.identifier, body.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const deviceInfo = {
            ip: req.ip,
            device: req.headers['user-agent'] || 'Unknown',
            os: 'Unknown', // Could parse using library
            browser: 'Unknown', // Could parse using library
        };

        const tokens = await this.loginService.generateSessionToken(user, deviceInfo);

        // Set HttpOnly Cookie
        res.setCookie('access_token', tokens.access_token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // or 'strict' if feasible
            maxAge: 24 * 60 * 60, // 24h
        });

        return tokens;
    }
}
