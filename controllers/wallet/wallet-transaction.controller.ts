import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallets')
export class WalletTransactionController {
    constructor(private walletTx: WalletTransactionService) { }

    @Get('me/transactions')
    @UseGuards(AuthGuard)
    async getTransactions(@CurrentUser() user: any, @Query() query: any) {
        return this.walletTx.getHistory(user.sub || user.id, query);
    }
}
