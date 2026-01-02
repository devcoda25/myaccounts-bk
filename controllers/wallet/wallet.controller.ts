import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { WalletCoreService } from '../../services/wallet/wallet-core.service';
import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletController {
    constructor(
        private walletCore: WalletCoreService,
        private walletTx: WalletTransactionService
    ) { }

    @Get('me')
    @UseGuards(AuthGuard)
    async getMyWallet(@CurrentUser() user: any) {
        return this.walletCore.getWallet(user.sub || user.id);
    }

    async getStats(@CurrentUser() user: any, @Query('days') days?: number) {
        return this.walletCore.getStats(user.sub || user.id);
    }

    @Get('me/transactions')
    @UseGuards(AuthGuard)
    async getTransactions(@CurrentUser() user: any, @Query() query: any) {
        return this.walletTx.getHistory(user.sub || user.id, query);
    }

    @Post('me/add-funds')
    @UseGuards(AuthGuard)
    async addFunds(@CurrentUser() user: any, @Body('amount') amount: number) {
        return this.walletTx.deposit(user.sub || user.id, amount);
    }

    @Post('me/withdraw')
    @UseGuards(AuthGuard)
    async withdraw(@CurrentUser() user: any, @Body('amount') amount: number) {
        return this.walletTx.withdraw(user.sub || user.id, amount);
    }
}
