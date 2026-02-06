import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SecurityService } from '../../services/security/security.service';
import { MfaService } from '../../services/auth/mfa.service';
import { PasskeysService } from '../../services/auth/passkeys.service';
import { PasswordService } from '../../services/auth/password.service';
import { SessionRepository } from '../../repos/auth/session.repository';
import { SessionManagementService } from '../../services/auth/session-management.service';
import { SecurityController } from '../../controllers/security/security.controller';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule
    ],
    providers: [
        SecurityService,
        MfaService,
        PasskeysService,
        PasswordService,
        SessionRepository,
        SessionManagementService
    ],
    controllers: [SecurityController],
    exports: [SecurityService]
})
export class SecurityModule { }
