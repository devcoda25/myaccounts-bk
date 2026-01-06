import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { WalletModule } from '../wallet/wallet.module';
import { PaymentConsumer } from './consumers/payment.consumer';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [
        KafkaModule,
        WalletModule,
        PrismaModule,
        RedisModule
    ],
    providers: [PaymentConsumer],
})
export class WorkerModule { }
