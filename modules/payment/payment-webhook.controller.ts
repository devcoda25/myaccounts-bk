import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ApwgApiService } from './apwgapi.service';
import { WalletLedgerService } from '../../services/wallet/wallet-ledger.service';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Controller('webhooks/payment')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private apwgApiService: ApwgApiService,
        private prisma: PrismaService,
        private walletLedger: WalletLedgerService,
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
            try {
                await this.walletLedger.fulfillAtomicDeposit(
                    payload.referenceId,
                    payload.providerReference
                );
                this.logger.log(`Successfully fulfilled deposit: ${payload.referenceId}`);
            } catch (err: any) {
                this.logger.error(`Fulfillment failed for ref ${payload.referenceId}: ${err.message}`);
                throw new BadRequestException(err.message);
            }
        }

        return { status: 'processed' };
    }
}
