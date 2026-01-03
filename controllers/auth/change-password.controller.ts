import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PasswordService } from '../../services/auth/password.service';
import { ChangePasswordDto } from '../../common/dto/auth/change-password.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('auth')
export class ChangePasswordController {
    constructor(private passwordService: PasswordService) { }

    @Post('change-password')
    @UseGuards(AuthGuard)
    async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
        const userId = req.user.sub;
        const sessionId = req.user.jti;
        return this.passwordService.changePassword(userId, body.oldPassword, body.newPassword, body.logoutOthers, sessionId);
    }
}
