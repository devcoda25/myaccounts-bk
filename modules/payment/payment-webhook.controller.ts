import { Controller, Post, Body, Headers, BadRequestException, Logger } from '@nestjs/common';
import { ApwgApiService } from './apwgapi.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('webhooks/payment')
export class PaymentWebhookController {
    private readonly logger = new Logger(PaymentWebhookController.name);

    constructor(
        private apwgApiService: ApwgApiService,
        private prisma: PrismaService,
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

        this.logger.log(`Received valid payment webhook: ${payload.event}`);

        // Processing logic will be added when we implement the Transaction logic
        // specific to deposits/withdrawals status updates.

        return { status: 'received' };
    }
}
