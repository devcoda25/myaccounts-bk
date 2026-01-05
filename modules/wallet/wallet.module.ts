import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { KycModule } from '../kyc/kyc.module';
import { WalletFindRepository } from '../../repos/wallet/wallet-find.repository';
import { WalletCreateRepository } from '../../repos/wallet/wallet-create.repository';
import { WalletUpdateRepository } from '../../repos/wallet/wallet-update.repository';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';
import { TransactionCreateRepository } from '../../repos/wallet/transaction-create.repository';
import { WalletCoreService } from '../../services/wallet/wallet-core.service';
import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';
import { WalletController } from '../../controllers/wallet/wallet.controller';
import { WalletLedgerService } from '../../services/wallet/wallet-ledger.service';
// import { WalletTransactionController } from '../../controllers/wallet/wallet-transaction.controller';

import { UserDisputesService } from '../../services/wallet/user-disputes.service';
import { UserDisputesController } from '../../controllers/wallet/user-disputes.controller';
import { AdminModule } from '../admin/admin.module';
import { FeeService } from '../../services/wallet/fee.service';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule), forwardRef(() => PaymentModule), KycModule, AdminModule],
    providers: [
        WalletFindRepository,
        WalletCreateRepository,
        WalletUpdateRepository,
        TransactionFindRepository,
        TransactionCreateRepository,
        WalletCoreService,
        WalletTransactionService,
        UserDisputesService,
        FeeService,
        WalletLedgerService
    ],
    controllers: [WalletController, UserDisputesController],
    exports: [WalletCoreService, WalletTransactionService, WalletLedgerService], // Export if needed
})
export class WalletModule { }
