import { Module } from '@nestjs/common';
import { AppsController } from '../../controllers/apps/apps.controller';
import { AppsService } from '../../services/apps/apps.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';

import { AppMembersController } from './app-members.controller';
import { AppMembersService } from './app-members.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../../services/notifications/email.service';
import { ZohoProvider } from '../../services/notifications/email-providers/zoho.provider';
import { EmailJsProvider } from '../../services/notifications/email-providers/emailjs.provider';
import { SubmailProvider } from '../../services/notifications/email-providers/submail.provider';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [AppsController, AppMembersController],
    providers: [AppsService, OAuthClientRepository, AppMembersService, EmailService, ZohoProvider, EmailJsProvider, SubmailProvider],
    exports: [AppsService]
})
export class AppsModule { }
