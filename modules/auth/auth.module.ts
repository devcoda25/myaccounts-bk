import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { LoginService } from '../../services/auth/login.service';
import { VerificationService } from '../../services/auth/verification.service';
import { PasswordService } from '../../services/auth/password.service';
import { OidcService } from '../../services/auth/oidc.service';
import { SocialAuthService } from '../../services/auth/social-auth.service';
import { LoginController } from '../../controllers/auth/login.controller';
import { VerifyEmailController } from '../../controllers/auth/verify-email.controller';
import { ForgotPasswordController } from '../../controllers/auth/forgot-password.controller';
import { ResetPasswordController } from '../../controllers/auth/reset-password.controller';
import { ChangePasswordController } from '../../controllers/auth/change-password.controller';
import { OidcController } from '../../controllers/auth/oidc.controller';
import { SocialLoginController } from '../../controllers/auth/social-login.controller';

@Module({
    imports: [forwardRef(() => UsersModule)],
    providers: [
        LoginService,
        VerificationService,
        PasswordService,
        OidcService,
        SocialAuthService
    ],
    controllers: [
        OidcController,
        LoginController,
        VerifyEmailController,
        ForgotPasswordController,
        ResetPasswordController,
        ChangePasswordController,
        SocialLoginController
    ],
    exports: [LoginService, VerificationService, PasswordService, OidcService, SocialAuthService],
})
export class AuthModule { }
