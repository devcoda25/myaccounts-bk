import { Module } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';
import { AuthModule } from '../modules/auth/auth.module';
import { OidcBaseModule } from '../modules/auth/oidc-base.module';
import { UsersModule } from '../modules/users/users.module';
import { WalletModule } from '../modules/wallet/wallet.module';
import { DebugModule } from '../modules/debug/debug.module';

import { OrganizationModule } from '../modules/organizations/organization.module';
import { AdminModule } from '../modules/admin/admin.module';
import { KycModule } from '../modules/kyc/kyc.module';
import { ParentalModule } from '../modules/parental/parental.module';

const routes: Routes = [
    {
        path: '/',
        module: OidcBaseModule
    },
    { path: 'auth', module: AuthModule },
    { path: 'users', module: UsersModule },
    { path: 'wallets', module: WalletModule },
    { path: 'orgs', module: OrganizationModule },
    { path: 'admin', module: AdminModule },
    { path: 'kyc', module: KycModule }, // Expose /kyc
    { path: 'debug', module: DebugModule },
    { path: 'parental', module: ParentalModule }
];

@Module({
    imports: [RouterModule.register(routes)],
    exports: [RouterModule],
})
export class RoutesModule { }
