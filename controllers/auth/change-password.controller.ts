import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PasswordService } from '../../services/auth/password.service';
import { ChangePasswordDto } from '../../common/dto/change-password.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class ChangePasswordController {
    constructor(private passwordService: PasswordService) { }

    @Post('change-password')
    @UseGuards(AuthGuard)
    async changePassword(@CurrentUser() user: any, @Body() body: ChangePasswordDto) {
        const userId = user.sub || user.id;
        return this.passwordService.changePassword(userId, body.oldPassword, body.newPassword);
    }
}
