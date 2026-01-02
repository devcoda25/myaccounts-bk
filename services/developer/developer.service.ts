import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class DeveloperService {
    private readonly logger = new Logger(DeveloperService.name);

    constructor(private prisma: PrismaService) { }

    async getApiKeys(userId: string) {
        return this.prisma.apiKey.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createApiKey(userId: string, name: string, scopes: string[]) {
        const rawKey = `EVZK_${this.generateRandomString(32)}`;
        const prefix = rawKey.substring(0, 9) + '...';
        const keyHash = await bcrypt.hash(rawKey, 10);

        const apiKey = await this.prisma.apiKey.create({
            data: {
                userId,
                name,
                keyHash,
                prefix,
                scopes,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'api_key.created',
                actorName: 'Developer',
                details: { name, id: apiKey.id, target: name },
            },
        });

        // We only return the rawKey once upon creation
        return {
            ...apiKey,
            secret: rawKey,
        };
    }

    async revokeApiKey(userId: string, id: string) {
        const key = await this.prisma.apiKey.update({
            where: { id, userId },
            data: { status: 'Revoked' },
        });

        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'api_key.revoked',
                actorName: 'Developer',
                details: { name: key.name, id: key.id, target: key.name },
            },
        });

        return key;
    }

    async getOAuthClients(ownerId: string) {
        return this.prisma.oAuthClient.findMany({
            where: { ownerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createOAuthClient(ownerId: string, data: { name: string; type: 'confidential' | 'public'; redirectUris: string[] }) {
        const clientId = `ev_cli_${this.generateRandomString(16)}`;
        let clientSecret = null;
        let clientSecretHash = null;

        if (data.type === 'confidential') {
            clientSecret = `ev_sec_${this.generateRandomString(32)}`;
            clientSecretHash = await bcrypt.hash(clientSecret, 10);
        }

        const client = await this.prisma.oAuthClient.create({
            data: {
                ownerId,
                name: data.name,
                clientId,
                clientSecretHash,
                isPublic: data.type === 'public',
                redirectUris: data.redirectUris,
                isFirstParty: false, // User registered clients are usually third-party
                grantTypes: ['authorization_code', 'refresh_token'],
            },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: ownerId,
                action: 'oauth_client.created',
                actorName: 'Developer',
                details: { name: client.name, id: client.id, target: client.name },
            },
        });

        return {
            ...client,
            clientSecret, // Return raw secret once
        };
    }

    async revokeOAuthClient(ownerId: string, id: string) {
        // In our simplified schema, we use status for ApiKey but for OAuthClient we might just delete or have a status too.
        // The current schema doesn't have a 'status' field for OAuthClient, let's check.
        // It doesn't. We'll just delete it for now or we could have added a status field.
        // I'll stick to what's in the schema or modify it if needed.
        // Let's just delete it to "revoke" it for now.
        const client = await this.prisma.oAuthClient.delete({
            where: { id, ownerId },
        });

        await this.prisma.auditLog.create({
            data: {
                userId: ownerId,
                action: 'oauth_client.revoked',
                actorName: 'Developer',
                details: { name: client.name, id: client.id, target: client.name },
            },
        });

        return client;
    }

    async getDeveloperAuditLogs(userId: string) {
        return this.prisma.auditLog.findMany({
            where: {
                userId,
                action: {
                    in: ['api_key.created', 'api_key.revoked', 'oauth_client.created', 'oauth_client.revoked'],
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    private generateRandomString(length: number): string {
        return randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
}
