import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApwgApiService } from './apwgapi.service';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { forwardRef } from '@nestjs/common';

@Global()
@Module({
    imports: [PrismaModule, ConfigModule, forwardRef(() => WalletModule)],
    controllers: [PaymentWebhookController, PaymentController],
    providers: [ApwgApiService, PaymentService],
    exports: [ApwgApiService, PaymentService],
})
export class PaymentModule { }
