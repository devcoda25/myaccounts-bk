import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { SecurityService } from '../../services/security/security.service';
import { SecurityController } from '../../controllers/security/security.controller';
import { AuthModule } from '../auth/auth.module'; // For AuthGuard dependencies if needed, usually AuthModule exports JwtModule etc.

@Module({
    imports: [PrismaModule],
    providers: [SecurityService],
    controllers: [SecurityController],
    exports: [SecurityService]
})
export class SecurityModule { }
