import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { ApwgApiService } from './apwgapi.service';

@Injectable()
export class PaymentService {
    constructor(
        private prisma: PrismaService,
        private apwgService: ApwgApiService,
    ) { }

    async getMethods(userId: string) {
        return this.prisma.paymentMethod.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' },
        });
    }

    async addMethod(userId: string, dto: {
        type: string;
        provider: string;
        token?: string; // In a real flow, this would come from the frontend after tokenization
        details: any;
    }) {
        // In a real scenario, we might verify the token with apwgService here
        // or register the customer if not already registered.

        // If setting as default, unset others?
        // For now, let's just add it. If it's the first one, make it default.
        const count = await this.prisma.paymentMethod.count({ where: { userId } });
        const isDefault = count === 0;

        // Use a placeholder token if none provided (for demo/simulated flows)
        const token = dto.token || `tok_${Math.random().toString(36).slice(2)}`;

        return this.prisma.paymentMethod.create({
            data: {
                userId,
                type: dto.type,
                provider: dto.provider,
                token,
                details: dto.details,
                isDefault,
            },
        });
    }

    async removeMethod(userId: string, methodId: string) {
        const method = await this.prisma.paymentMethod.findUnique({
            where: { id: methodId },
        });

        if (!method || method.userId !== userId) {
            throw new NotFoundException('Payment method not found');
        }

        await this.prisma.paymentMethod.delete({
            where: { id: methodId },
        });

        // If we deleted the default, make another one default?
        if (method.isDefault) {
            const first = await this.prisma.paymentMethod.findFirst({ where: { userId } });
            if (first) {
                await this.prisma.paymentMethod.update({
                    where: { id: first.id },
                    data: { isDefault: true }
                });
            }
        }

        return { success: true };
    }

    async setDefaultMethod(userId: string, methodId: string) {
        const method = await this.prisma.paymentMethod.findUnique({
            where: { id: methodId },
        });

        if (!method || method.userId !== userId) {
            throw new NotFoundException('Payment method not found');
        }

        // Unset current default
        await this.prisma.paymentMethod.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });

        // Set new default
        return this.prisma.paymentMethod.update({
            where: { id: methodId },
            data: { isDefault: true },
        });
    }
}
