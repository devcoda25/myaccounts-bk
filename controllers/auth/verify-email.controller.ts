import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from '../../services/auth/verification.service';
import { VerifyEmailDto } from '../../common/dto/verify-email.dto';

@Controller('auth')
export class VerifyEmailController {
    constructor(private verificationService: VerificationService) { }

    @Post('verify-email')
    async verifyEmail(@Body() body: VerifyEmailDto) {
        return this.verificationService.verifyEmail(body.identifier, body.code);
    }
}
