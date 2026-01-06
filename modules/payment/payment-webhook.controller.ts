import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ApwgApiService } from './apwgapi.service';
import { KafkaService } from '../../modules/kafka/kafka.service';
import { EventPattern } from '../../common/interfaces/events.interface';

@Controller('webhooks/payment')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private apwgApiService: ApwgApiService,
        private kafkaService: KafkaService,
    ) { }

    @Post()
    async handleWebhook(
        @Headers('x-signature') signature: string,
        @Body() payload: any,
    ) {
        if (!signature) {
            throw new BadRequestException('Missing signature');
        }

        const isValid = this.apwgApiService.verifySignature(signature, payload);
        if (!isValid) {
            this.logger.warn('Invalid webhook signature received');
            throw new BadRequestException('Invalid signature');
        }

        this.logger.log(`Received valid payment webhook: ${payload.event} for ref: ${payload.referenceId}`);

        // Fulfillment logic for successful deposits
        if (payload.event === 'payment_success' || payload.event === 'deposit_success') {
            await this.kafkaService.emit(EventPattern.PAYMENT_RECEIVED, {
                referenceId: payload.referenceId,
                providerReference: payload.providerReference,
                amount: payload.amount,
                currency: payload.currency,
                raw: payload
            });
            this.logger.log(`Emitted payment.received for ${payload.referenceId}`);
        }

        return { status: 'processed' };
    }
}
