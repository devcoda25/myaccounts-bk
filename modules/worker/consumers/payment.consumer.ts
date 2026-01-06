import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaService } from '../../kafka/kafka.service';
import { EventPattern } from '../../../common/interfaces/events.interface';
import { WalletLedgerService } from '../../../services/wallet/wallet-ledger.service';

@Injectable()
export class PaymentConsumer implements OnModuleInit {
    private readonly logger = new Logger(PaymentConsumer.name);

    constructor(
        private kafkaService: KafkaService,
        private walletLedger: WalletLedgerService
    ) { }

    async onModuleInit() {
        await this.kafkaService.subscribe(EventPattern.PAYMENT_RECEIVED, async (payload) => {
            await this.handlePaymentReceived(payload);
        });
    }

    private async handlePaymentReceived(event: any) {
        const { referenceId, providerReference } = event.payload;
        this.logger.log(`Processing payment fulfillment for ${referenceId}`);

        try {
            await this.walletLedger.fulfillAtomicDeposit(referenceId, providerReference);
            await this.kafkaService.emit(EventPattern.PAYMENT_PROCESSED, { referenceId, status: 'SUCCESS' });
            this.logger.log(`Successfully processed payment ${referenceId}`);
        } catch (err: any) {
            this.logger.error(`Failed to fulfill payment ${referenceId}`, err);
            // In a real system: Push to DLQ or Retry Topic
            // manual ACK management would be handled by kafkaService abstraction
        }
    }
}
