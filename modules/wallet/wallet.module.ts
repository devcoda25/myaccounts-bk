import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletFindRepository } from '../../repos/wallet/wallet-find.repository';
import { WalletCreateRepository } from '../../repos/wallet/wallet-create.repository';
import { WalletUpdateRepository } from '../../repos/wallet/wallet-update.repository';
import { TransactionFindRepository } from '../../repos/wallet/transaction-find.repository';
import { TransactionCreateRepository } from '../../repos/wallet/transaction-create.repository';
import { WalletCoreService } from '../../services/wallet/wallet-core.service';
import { WalletTransactionService } from '../../services/wallet/wallet-transaction.service';
import { WalletController } from '../../controllers/wallet/wallet.controller';
// import { WalletTransactionController } from '../../controllers/wallet/wallet-transaction.controller';

@Module({
    imports: [PrismaModule, forwardRef(() => AuthModule), PaymentModule],
    providers: [
        WalletFindRepository,
        WalletCreateRepository,
        WalletUpdateRepository,
        TransactionFindRepository,
        TransactionCreateRepository,
        WalletCoreService,
        WalletTransactionService
    ],
    controllers: [WalletController],
    exports: [WalletCoreService, WalletTransactionService], // Export if needed
})
export class WalletModule { }
