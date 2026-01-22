import { Module } from '@nestjs/common';
import { PrivacyController } from '../../controllers/privacy/privacy.controller';
import { PrivacyService } from '../../services/privacy/privacy.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [UsersModule],
    controllers: [PrivacyController],
    providers: [PrivacyService],
    exports: [PrivacyService]
})
export class PrivacyModule { }
