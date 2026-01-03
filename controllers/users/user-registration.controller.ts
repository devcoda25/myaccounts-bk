import { Controller, Post, Body, Inject, forwardRef } from '@nestjs/common';
import { UserManagementService } from '../../services/users/user-management.service';
import { VerificationService } from '../../services/auth/verification.service';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';

@Controller('users')
export class UserRegistrationController {
    constructor(
        private userManagementService: UserManagementService,
        @Inject(forwardRef(() => VerificationService))
        private verificationService: VerificationService
    ) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.userManagementService.create(createUserDto);
        // Trigger verification (using VerificationService directly)
        const verification = await this.verificationService.requestVerification(user.email, 'EMAIL_VERIFY');
        return { ...user, debug_verification_code: verification.debug_code };
    }
}
