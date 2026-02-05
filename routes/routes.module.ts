import { Module } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { OidcBaseModule } from '../modules/auth/oidc-base.module';
import { UsersModule } from '../modules/users/users.module';
import { DebugModule } from '../modules/debug/debug.module';
// Removed WalletModule and OrganizationModule
import { AdminModule } from '../modules/admin/admin.module';

import { ParentalModule } from '../modules/parental/parental.module';
import { AppsModule } from '../modules/apps/apps.module';
import { SecurityModule } from '../modules/security/security.module';

const routes: Routes = [
    {
        path: '/',
        module: OidcBaseModule
    },
    { path: 'auth', module: AuthModule },
    { path: 'users', module: UsersModule },
    // { path: 'wallets', module: WalletModule },
    // { path: 'orgs', module: OrganizationModule },
    { path: 'admin', module: AdminModule },

    { path: 'debug', module: DebugModule },
    { path: 'parental', module: ParentalModule },
    { path: 'apps', module: AppsModule },
    { path: 'security', module: SecurityModule }
];

@Module({
    imports: [RouterModule.register(routes)],
    exports: [RouterModule],
})
export class RoutesModule { }
