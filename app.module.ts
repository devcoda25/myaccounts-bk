import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma-lib/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OidcModule } from './modules/auth/oidc.module';
import { RouterModule, Routes } from '@nestjs/core';

import { UsersModule } from './modules/users/users.module';

import { AdminModule } from './modules/admin/admin.module';
import { DebugModule } from './modules/debug/debug.module';

import { ParentalModule } from './modules/parental/parental.module';
import { HealthModule } from './modules/health/health.module';

import { SecurityModule } from './modules/security/security.module';
import { AppsModule } from './modules/apps/apps.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SupportModule } from './modules/support/support.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { OrgsModule } from './modules/orgs/orgs.module';

import { EdgeGuard } from './middleware/edge-guard.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Redis Storage
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { validateEnv } from './utils/env.validation';
import { RedisModule } from './modules/redis/redis.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { StorageModule } from './modules/storage/storage.module';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from './common/common.module';

const env = validateEnv(process.env);

// Define routes
const routes: Routes = [
    {
        path: '/',
        module: OidcModule
    },
    { path: 'auth', module: AuthModule },
    { path: 'users', module: UsersModule },
    { path: 'admin', module: AdminModule },
    { path: 'debug', module: DebugModule },
    { path: 'parental', module: ParentalModule },
    { path: 'health', module: HealthModule },
    { path: 'security', module: SecurityModule },
    { path: 'apps', module: AppsModule },
    { path: 'notifications', module: NotificationsModule },
    { path: 'support', module: SupportModule },
    { path: 'privacy', module: PrivacyModule },
    { path: 'orgs', module: OrgsModule },
];

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        CommonModule,
        ThrottlerModule.forRoot({
            throttlers: [{
                ttl: 60000,
                limit: 100,
            }],
            storage: new ThrottlerStorageRedisService(env.REDIS_URL),
        }),
        RedisModule,
        KafkaModule,
        StorageModule,
        PrometheusModule.register(),
        AuthModule,
        OidcModule,
        UsersModule,
        OrgsModule,
        AdminModule,
        PrismaModule,
        DebugModule,
        ParentalModule,
        HealthModule,
        SecurityModule,
        AppsModule,
        NotificationsModule,
        SupportModule,
        PrivacyModule,
        RouterModule.register(routes)
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: EdgeGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule { }
