import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { WalletCoreService } from '../../services/wallet/wallet-core.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletController {
    constructor(private walletCore: WalletCoreService) { }

    @Get('me')
    @UseGuards(AuthGuard)
    async getMyWallet(@CurrentUser() user: any) {
        return this.walletCore.getWallet(user.sub || user.id);
    }

    @Get('me/stats')
    @UseGuards(AuthGuard)
    async getStats(@CurrentUser() user: any, @Query('days') days?: number) {
        return this.walletCore.getStats(user.sub || user.id);
    }
}
