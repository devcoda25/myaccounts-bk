import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserManagementService } from '../../services/users/user-management.service';
import { UserQueryService } from '../../services/users/user-query.service';
import { MediaService } from '../../services/media/media.service';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { AuthCodeRepository } from '../../repos/users/auth-code.repository';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserRegistrationController } from '../../controllers/users/user-registration.controller';
import { UserProfileController } from '../../controllers/users/user-profile.controller';
import { AvatarController } from '../../controllers/users/avatar.controller';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule)],
    providers: [
        UserManagementService,
        UserQueryService,
        MediaService,
        UserFindRepository,
        UserCreateRepository,
        UserUpdateRepository,
        AuthCodeRepository,
        VerificationRepository
    ],
    controllers: [
        UserRegistrationController,
        UserProfileController,
        AvatarController
    ],
    exports: [
        UserManagementService,
        UserQueryService,
        UserFindRepository,
        UserCreateRepository,
        UserUpdateRepository,
        AuthCodeRepository,
        VerificationRepository
    ],
})
export class UsersModule { }
