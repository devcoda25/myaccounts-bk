import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

@Injectable()
export class AppsService implements OnModuleInit {
    private readonly logger = new Logger(AppsService.name);

    constructor(private oauthClientRepo: OAuthClientRepository) { }

    async onModuleInit() {
        try {
            await this.seedApps();
        } catch (e) {
            this.logger.error('Failed to seed apps', e);
        }
    }

    private async seedApps() {
        this.logger.log('Seeding OAuth Clients for Apps...');

        const coreApps = [
            { id: 'charging', name: 'EVzone Charging', secret: 'charging-secret-123' },
            { id: 'marketplace', name: 'EVzone Marketplace', secret: 'marketplace-secret-123' },
            { id: 'pay', name: 'EVzone Pay', secret: 'pay-secret-123' },
            { id: 'school', name: 'EVzone School', secret: 'school-secret-123' },
            { id: 'agenthub', name: 'AgentHub', secret: 'agenthub-secret-123' },
            { id: 'mylivedealz', name: 'MyLiveDealz', secret: 'mylivedealz-secret-123' },
            { id: 'logistics', name: 'EVzone Logistics', secret: 'logistics-secret-123' },
            { id: 'creator', name: 'Creator Studio', secret: 'creator-secret-123' },
        ];

        for (const app of coreApps) {
            const secretHash = await argon2.hash(app.secret);
            // In production, Redirect URI should be configurable per environment.
            // For now, we point to localhost:3000/callback as dummy, or the real frontend if known.
            const redirectUri = process.env.APP_REDIRECT_URI_BASE
                ? `${process.env.APP_REDIRECT_URI_BASE}/${app.id}/callback`
                : `http://localhost:3000/callback/${app.id}`;

            await this.oauthClientRepo.upsertClient({
                clientId: app.id,
                name: app.name,
                clientSecretHash: secretHash,
                redirectUris: [redirectUri],
                isFirstParty: true,
                isPublic: false // Confidential clients
            });
            this.logger.log(`Seeded app: ${app.name} (ID: ${app.id})`);
            // Security Note: We only log the PLAIN secret here for dev purposes if needed, 
            // but effectively we just hardcoded them above for this "demo" phase.
        }
    }

    async getApps(userId: string) {
        const { firstParty, consents } = await this.oauthClientRepo.getAppsForUser(userId);

        // Map consents to a quick lookup
        const consentMap = new Map();
        consents.forEach(c => consentMap.set(c.clientId, c));

        // Transform to frontend model
        return firstParty.map(app => {
            const consent = consentMap.get(app.clientId);
            const status = consent ? 'Connected' : 'Disconnected';

            // Construct Launch URL
            // /auth/authorize?client_id=...&response_type=code&redirect_uri=...&scope=openid profile email
            const redirectUri = app.redirectUris[0];
            const launchUrl = `/auth/authorize?client_id=${app.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email&code_challenge=S256_placeholder&code_challenge_method=S256`;

            return {
                key: app.clientId,
                name: app.name,
                status,
                lastUsedAt: Date.now(), // Placeholder, needs session integration
                launchUrl
            };
        });
    }

    async getPermissions(userId: string) {
        const { consents } = await this.oauthClientRepo.getAppsForUser(userId);
        return consents.map(c => ({
            id: c.clientId,
            name: c.client.name,
            kind: c.client.isFirstParty ? 'EVzone' : 'Third-party',
            scopes: c.scopes,
            lastUsedAt: Date.now(), // Placeholder
            revoked: false // Active consents are by definition not revoked
        }));
    }

    async revokeAccess(userId: string, clientId: string) {
        return this.oauthClientRepo.revokeConsent(userId, clientId);
    }
}
