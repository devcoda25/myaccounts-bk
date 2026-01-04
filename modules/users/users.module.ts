import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserManagementService } from '../../services/users/user-management.service';
import { UserQueryService } from '../../services/users/user-query.service';
import { MediaService } from '../../services/media/media.service';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { UserDeleteRepository } from '../../repos/users/user-delete.repository';
import { AuthCodeRepository } from '../../repos/users/auth-code.repository';
import { UserContactRepository } from '../../repos/users/user-contact.repository';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserCredentialRepository } from '../../repos/users/user-credential.repository';
import { UserRegistrationController } from '../../controllers/users/user-registration.controller';
// import { UserProfileController } from '../../controllers/users/user-profile.controller';
// import { AvatarController } from '../../controllers/users/avatar.controller';
import { UsersController } from '../../controllers/users/users.controller';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule)],
    providers: [
        UserManagementService,
        UserQueryService,
        MediaService,
        UserFindRepository,
        UserCreateRepository,
        UserUpdateRepository,
        UserDeleteRepository,
        UserContactRepository,
        AuthCodeRepository,
        VerificationRepository,
        UserCredentialRepository
    ],
    controllers: [
        UserRegistrationController,
        // UserProfileController, // Removed in favor of UsersController
        // AvatarController, // Removed in favor of UsersController
        UsersController
    ],
    exports: [
        UserManagementService,
        UserQueryService,
        UserFindRepository,
        UserCreateRepository,
        UserUpdateRepository,
        UserDeleteRepository,
        UserContactRepository,
        AuthCodeRepository,
        VerificationRepository,
        UserCredentialRepository
    ],
})
export class UsersModule { }
