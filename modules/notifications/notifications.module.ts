import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { EmailService } from '../../services/notifications/email.service';
import { ZohoProvider } from '../../services/notifications/email-providers/zoho.provider';
import { EmailJsProvider } from '../../services/notifications/email-providers/emailjs.provider';
import { SubmailProvider } from '../../services/notifications/email-providers/submail.provider';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationsController],
    providers: [
        NotificationsService,
        EmailService,
        ZohoProvider,
        EmailJsProvider,
        SubmailProvider
    ],
    exports: [NotificationsService, EmailService],
})
export class NotificationsModule { }
