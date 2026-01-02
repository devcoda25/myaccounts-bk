import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class OAuthClientRepository {
    constructor(private prisma: PrismaService) { }

    async findById(clientId: string) {
        return this.prisma.oAuthClient.findUnique({
            where: { clientId }
        });
    }

    async findConsent(userId: string, clientId: string) {
        return this.prisma.oAuthConsent.findUnique({
            where: {
                userId_clientId: {
                    userId,
                    clientId
                }
            }
        });
    }

    async createConsent(userId: string, clientId: string, scopes: string[]) {
        return this.prisma.oAuthConsent.upsert({
            where: {
                userId_clientId: {
                    userId,
                    clientId
                }
            },
            update: {
                scopes
            },
            create: {
                userId,
                clientId,
                scopes
            }
        });
    }
}
