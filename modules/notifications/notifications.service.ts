
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50, // simple pagination limit
        });
    }

    async markAsRead(userId: string, id: string) {
        // Verify ownership
        const count = await this.prisma.notification.count({
            where: { id, userId },
        });
        if (count === 0) return null; // or throw NotFound

        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }

    async remove(userId: string, id: string) {
        // Verify ownership
        const count = await this.prisma.notification.count({
            where: { id, userId },
        });
        if (count === 0) return null;

        return this.prisma.notification.delete({
            where: { id },
        });
    }

    // Internal method for other services to create notifications
    async create(userId: string, title: string, description: string, type: 'SECURITY' | 'INFO' | 'SUCCESS' | 'WARNING', data?: any) {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                description,
                type,
                data,
            },
        });
    }
}
