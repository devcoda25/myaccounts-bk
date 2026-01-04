import { Module, Global } from '@nestjs/common';
import { ApwgApiService } from './apwgapi.service';
import { PaymentWebhookController } from './payment-webhook.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';

@Global()
@Module({
    imports: [PrismaModule],
    controllers: [PaymentWebhookController, PaymentController],
    providers: [ApwgApiService, PaymentService],
    exports: [ApwgApiService, PaymentService],
})
export class PaymentModule { }
