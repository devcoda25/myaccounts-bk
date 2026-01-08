import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { UserContact, Prisma } from '@prisma/client';

@Injectable()
export class UserContactRepository {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        type: string;
        label: string;
        value: string;
        isPrimary?: boolean;
        capabilities?: Prisma.InputJsonValue;
    }): Promise<UserContact> {
        return this.prisma.userContact.create({
            data
        });
    }

    async delete(id: string) {
        return this.prisma.userContact.delete({
            where: { id }
        });
    }

    async verify(id: string) {
        return this.prisma.userContact.update({
            where: { id },
            data: { verified: true }
        });
    }

    async update(id: string, data: Prisma.UserContactUpdateInput) {
        return this.prisma.userContact.update({
            where: { id },
            data
        });
    }
}
