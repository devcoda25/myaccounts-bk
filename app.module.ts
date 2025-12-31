import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma-lib/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WalletModule } from './modules/wallet/wallet.module';

@Module({
    imports: [PrismaModule, AuthModule, UsersModule, WalletModule],
    controllers: [],
    providers: [],
})
export class AppModule { }
