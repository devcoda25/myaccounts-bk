import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserCredentialRepository {
    constructor(private prisma: PrismaService) { }

    async upsert(providerType: string, providerId: string, userId: string, metadata?: Prisma.InputJsonValue) {
        return this.prisma.userCredential.upsert({
            where: {
                providerType_providerId: {
                    providerType,
                    providerId
                }
            },
            update: {
                userId,
                metadata: metadata || Prisma.JsonNull
            },
            create: {
                providerType,
                providerId,
                userId,
                metadata: metadata || Prisma.JsonNull
            }
        });
    }

    async findByProvider(providerType: string, providerId: string) {
        return this.prisma.userCredential.findUnique({
            where: {
                providerType_providerId: {
                    providerType,
                    providerId
                }
            },
            include: {
                user: true
            }
        });
    }
    async deleteByUserAndProvider(userId: string, providerType: string) {
        return this.prisma.userCredential.deleteMany({
            where: {
                userId,
                providerType
            }
        });
    }
}
