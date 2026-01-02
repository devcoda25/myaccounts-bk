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
import { VerifyPhoneController } from '../../controllers/auth/verify-phone.controller';
import { SocialLoginController } from '../../controllers/auth/social-login.controller';
import { SessionsController } from '../../controllers/auth/sessions.controller';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';
import { UserCredentialRepository } from '../../repos/users/user-credential.repository';
import { SessionRepository } from '../../repos/auth/session.repository';
import { SmsService } from '../../services/notifications/sms.service';
import { EmailService } from '../../services/notifications/email.service';
import { WhatsappService } from '../../services/notifications/whatsapp.service';
import { ZohoProvider } from '../../services/notifications/email-providers/zoho.provider';
import { EmailJsProvider } from '../../services/notifications/email-providers/emailjs.provider';
import { SubmailProvider } from '../../services/notifications/email-providers/submail.provider';

@Module({
    imports: [forwardRef(() => UsersModule)],
    providers: [
        LoginService,
        VerificationService,
        PasswordService,
        OidcService,
        SocialAuthService,
        SmsService,
        EmailService,
        WhatsappService,
        ZohoProvider,
        EmailJsProvider,
        SubmailProvider,
        OAuthClientRepository,
        UserCredentialRepository,
        SessionRepository
    ],
    controllers: [
        OidcController,
        LoginController,
        VerifyEmailController,
        ForgotPasswordController,
        ResetPasswordController,
        ChangePasswordController,
        SocialLoginController,
        VerifyPhoneController,
        SessionsController
    ],
    exports: [LoginService, VerificationService, PasswordService, OidcService, SocialAuthService],
})
export class AuthModule { }
