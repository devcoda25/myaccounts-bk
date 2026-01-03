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
    async upsertClient(data: {
        clientId: string;
        name: string;
        clientSecretHash?: string | null;
        redirectUris: string[];
        isFirstParty: boolean;
        isPublic: boolean;
    }) {
        return this.prisma.oAuthClient.upsert({
            where: { clientId: data.clientId },
            update: {
                name: data.name,
                redirectUris: data.redirectUris,
                // Do not overwrite secret if it exists, as re-seeding shouldn't break existing secrets unless intended
                // But for first-party constant seeding, we might want to ensure consistency. 
                // Let's decide to UPDATE it to match our seed config.
                clientSecretHash: data.clientSecretHash,
                isFirstParty: data.isFirstParty,
                isPublic: data.isPublic
            },
            create: data
        });
    }

    async getAppsForUser(userId: string) {
        // Find all first party apps
        const firstParty = await this.prisma.oAuthClient.findMany({
            where: { isFirstParty: true }
        });

        // Find consents for this user
        const consents = await this.prisma.oAuthConsent.findMany({
            where: { userId },
            include: { client: true }
        });

        return { firstParty, consents };
    }

    async revokeConsent(userId: string, clientId: string) {
        return this.prisma.oAuthConsent.deleteMany({
            where: {
                userId,
                clientId
            }
        });
    }
}
