
import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import Provider from 'oidc-provider';

// Access to Prisma outside DI because oidc-provider instantiates Adapter with 'new'
// We will follow the pattern of passing the prisma instance or using a singleton/helper if needed.
// However, the standard oidc-provider way is a class.
// We'll trust that we can import the Prisma Service or instance, 
// OR simpler: Use a global/static reference set during Module initialization.

export class PrismaOidcAdapter implements Provider.Adapter {
    private type: string;
    private static prisma: PrismaClient;

    constructor(name: string) {
        this.type = name;
    }

    // Hook to set the client from outside
    static setPrisma(prisma: PrismaClient) {
        PrismaOidcAdapter.prisma = prisma;
    }

    async upsert(id: string, payload: Provider.AdapterPayload, expiresIn: number): Promise<void> {
        if (this.type === 'Client') return; // Read-only

        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

        await PrismaOidcAdapter.prisma.oidcPayload.upsert({
            where: { id: this.key(id) },
            update: {
                payload: payload as Prisma.InputJsonValue,
                expiresAt,
                uid: payload.uid,
                grantId: payload.grantId,
                userCode: payload.userCode,
            },
            create: {
                id: this.key(id),
                type: this.type,
                payload: payload as Prisma.InputJsonValue,
                expiresAt,
                uid: payload.uid,
                grantId: payload.grantId,
                userCode: payload.userCode,
            },
        });
    }

    async find(id: string): Promise<Provider.AdapterPayload | undefined> {
        if (this.type === 'Client') {
            const client = await PrismaOidcAdapter.prisma.oAuthClient.findUnique({ where: { clientId: id } });
            if (!client) return undefined;

            return {
                client_id: client.clientId,
                client_secret: client.clientSecretHash || undefined, // Pass hash, verified by custom logic
                redirect_uris: client.redirectUris,
                grant_types: client.grantTypes,
                response_types: ['code'], // Simplify for now
                token_endpoint_auth_method: client.isPublic ? 'none' : 'client_secret_post', // Default to post/basic
                // Allow both basic and post if not public?
                // For now, let's say 'client_secret_basic' is default for backend.
            } as unknown as Provider.AdapterPayload;
        }

        const doc = await PrismaOidcAdapter.prisma.oidcPayload.findUnique({
            where: { id: this.key(id) },
        });

        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }

        return doc.payload as Provider.AdapterPayload;
    }

    async findByUserCode(userCode: string): Promise<Provider.AdapterPayload | undefined> {
        const doc = await PrismaOidcAdapter.prisma.oidcPayload.findFirst({
            where: { userCode },
        });

        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }

        return doc.payload as Provider.AdapterPayload;
    }

    async findByUid(uid: string): Promise<Provider.AdapterPayload | undefined> {
        const doc = await PrismaOidcAdapter.prisma.oidcPayload.findUnique({
            where: { uid },
        });

        if (!doc || (doc.expiresAt && doc.expiresAt < new Date())) {
            return undefined;
        }

        return doc.payload as Provider.AdapterPayload;
    }

    async destroy(id: string): Promise<void> {
        if (this.type === 'Client') return;
        try {
            await PrismaOidcAdapter.prisma.oidcPayload.delete({
                where: { id: this.key(id) },
            });
        } catch (e) {
            // Ignore not found
        }
    }

    async revokeByGrantId(grantId: string): Promise<void> {
        await PrismaOidcAdapter.prisma.oidcPayload.deleteMany({
            where: { grantId },
        });
    }

    async consume(id: string): Promise<void> {
        if (this.type === 'Client') return;
        await PrismaOidcAdapter.prisma.oidcPayload.update({
            where: { id: this.key(id) },
            data: { consumedAt: new Date() },
        });
    }

    private key(id: string): string {
        return `${this.type}:${id}`;
    }
}
