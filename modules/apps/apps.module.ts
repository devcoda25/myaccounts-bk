import { Module } from '@nestjs/common';
import { AppsController } from '../../controllers/apps/apps.controller';
import { AppsService } from '../../services/apps/apps.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';

@Module({
    imports: [PrismaModule],
    controllers: [AppsController],
    providers: [AppsService, OAuthClientRepository],
    exports: [AppsService]
})
export class AppsModule { }
