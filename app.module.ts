import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma-lib/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OidcModule } from './modules/auth/oidc.module';

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

import { ObservabilityModule } from './modules/observability/observability.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { HttpMetricsInterceptor } from './common/interceptors/http-metrics.interceptor';

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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CommonModule,
    ObservabilityModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      storage: new ThrottlerStorageRedisService(env.REDIS_URL),
    }),
    RedisModule,
    KafkaModule,
    StorageModule,
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
        config: {
          prefix: 'myaccounts_',
        },
      },
    }),

    // Auth modules
    AuthModule,
    OidcModule,

    // Feature modules
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
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
