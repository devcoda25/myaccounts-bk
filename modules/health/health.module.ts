import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { HealthController } from '../../controllers/health/health.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [PrismaModule, NotificationsModule, RedisModule],
    controllers: [HealthController],
    providers: [],
})
export class HealthModule { }
