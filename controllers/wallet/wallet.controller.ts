import { Controller, Get, Post, Body, UseGuards, Query, Req } from '@nestjs/common';
import { WalletCoreService } from '../../services/wallet/wallet-core.service';
import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';
import { FeeService } from '../../services/wallet/fee.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { FundWalletDto, TransactionQueryDto } from '../../common/dto/wallet/transaction.dto';

@Controller('wallets')
export class WalletController {
    constructor(
        private walletCore: WalletCoreService,
        private walletTx: WalletTransactionService,
        private feeService: FeeService
    ) { }

    @Get('fees')
    @UseGuards(AuthGuard)
    getFees(@Query('amount') amount: number, @Query('type') type: 'deposit' | 'withdrawal', @Query('method') method: string) {
        return {
            amount: Number(amount),
            fee: this.feeService.calculateFee(Number(amount), type, method),
            currency: 'UGX'
        };
    }

    @Get('me')
    @UseGuards(AuthGuard)
    async getMyWallet(@CurrentUser() user: AuthRequest['user']) {
        return this.walletCore.getWallet(user.id);
    }

    @Get('me/limits')
    @UseGuards(AuthGuard)
    async getLimits(@CurrentUser() user: AuthRequest['user']) {
        return this.walletCore.getLimits(user.id);
    }

    @Get('me/stats')
    @UseGuards(AuthGuard)
    async getStats(@CurrentUser() user: AuthRequest['user'], @Query('days') days?: number) {
        return this.walletCore.getStats(user.id);
    }

    @Get('me/transactions')
    @UseGuards(AuthGuard)
    async getTransactions(@CurrentUser() user: AuthRequest['user'], @Query() query: TransactionQueryDto) {
        return this.walletTx.getHistory(user.id, query);
    }

    @Post('me/add-funds')
    @UseGuards(AuthGuard)
    async addFunds(@CurrentUser() user: AuthRequest['user'], @Body() body: FundWalletDto) {
        return this.walletTx.deposit(user.id, body);
    }

    @Post('me/withdraw')
    @UseGuards(AuthGuard)
    async withdraw(@CurrentUser() user: AuthRequest['user'], @Body() body: FundWalletDto) {
        return this.walletTx.withdraw(user.id, body);
    }
}
