import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('wallets/me/methods')
@UseGuards(AuthGuard)
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Get()
    async listMethods(@Req() req: any) {
        // In a real app, use @UseGuards(JwtAuthGuard) and get user from req.user
        // For now assuming req.user.id is populated by global guard/middleware
        // or using a specific mock userId if not authenticated for testing (but you have auth)
        return this.paymentService.getMethods(req.user.id);
    }

    @Post()
    async addMethod(@Req() req: any, @Body() body: { type: string; provider: string; token?: string; details: any }) {
        return this.paymentService.addMethod(req.user.id, body);
    }

    @Delete(':id')
    async removeMethod(@Req() req: any, @Param('id') id: string) {
        return this.paymentService.removeMethod(req.user.id, id);
    }

    @Patch(':id/default')
    async setDefault(@Req() req: any, @Param('id') id: string) {
        return this.paymentService.setDefaultMethod(req.user.id, id);
    }
}
