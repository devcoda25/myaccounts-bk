import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaModule } from './prisma-lib/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OidcBaseModule } from './modules/auth/oidc-base.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { OrganizationModule } from './modules/organizations/organization.module';
import { AdminModule } from './modules/admin/admin.module';
import { DebugModule } from './modules/debug/debug.module';
import { KycModule } from './modules/kyc/kyc.module';
import { ParentalModule } from './modules/parental/parental.module';
import { HealthModule } from './modules/health/health.module';
import { DeveloperModule } from './modules/developer/developer.module';
import { SecurityModule } from './modules/security/security.module';
import { AppsModule } from './modules/apps/apps.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EdgeGuard } from './middleware/edge-guard.middleware';

@Module({
    imports: [
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 100,
        }]),
        PrometheusModule.register(),
        AuthModule,
        OidcBaseModule,
        UsersModule,
        WalletModule,
        OrganizationModule,
        AdminModule,
        PrismaModule,
        DebugModule,
        KycModule,
        ParentalModule,
        HealthModule,
        DeveloperModule,
        SecurityModule,
        AppsModule,
        NotificationsModule
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
    ],
})
export class AppModule { }
// Force rebuild 2
