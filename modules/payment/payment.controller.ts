import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';
// Assuming Authentication guard is available, using a placeholder import or similar if needed.
// For now, I'll assume standard request with user object attached
// You might need to adjust imports based on your Auth implementation (e.g. JwtAuthGuard)

@Controller('wallets/me/methods')
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
