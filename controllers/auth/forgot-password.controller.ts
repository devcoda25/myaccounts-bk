import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from '../../services/auth/verification.service';
import { ForgotPasswordDto } from '../../common/dto/forgot-password.dto';

@Controller('auth')
export class ForgotPasswordController {
    constructor(private verificationService: VerificationService) { }

    @Post('forgot-password')
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        return this.verificationService.requestVerification(body.identifier, 'PASSWORD_RESET');
    }
}
