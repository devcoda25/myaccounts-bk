import { Module } from '@nestjs/common';
import { SecurityController } from '../../controllers/security/security.controller';
import { SecurityService } from '../../services/security/security.service';
import { MfaController } from '../../controllers/auth/mfa.controller';
import { MfaService } from '../../services/auth/mfa.service';
import { PasskeysController } from '../../controllers/auth/passkeys.controller';
import { PasskeysService } from '../../services/auth/passkeys.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { SessionRepository } from '../../repos/auth/session.repository';

@Module({
    imports: [PrismaModule],
    controllers: [SecurityController, MfaController, PasskeysController],
    providers: [SecurityService, MfaService, PasskeysService, SessionRepository],
    exports: [SecurityService, MfaService, PasskeysService]
})
export class SecurityModule { }
