import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { LoginDto } from '../../common/dto/login.dto';
import { LoginService } from '../../services/auth/login.service';

@Controller('auth')
export class LoginController {
    constructor(private loginService: LoginService) { }

    @Post('login')
    async login(@Body() body: LoginDto, @Res() res: FastifyReply) {
        const { identifier, password } = body;
        const user = await this.loginService.validateUser(identifier, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.loginService.generateSessionToken(user);

        return res.send(tokens);
    }
}
