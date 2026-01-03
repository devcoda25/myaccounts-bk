import { Controller, Post, Body } from '@nestjs/common';
import { PasswordService } from '../../services/auth/password.service';
import { ResetPasswordDto } from '../../common/dto/auth/reset-password.dto';

@Controller('auth')
export class ResetPasswordController {
    constructor(private passwordService: PasswordService) { }

    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        return this.passwordService.resetPassword(body.identifier, body.code, body.password);
    }
}
