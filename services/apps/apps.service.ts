import { Injectable, Logger } from '@nestjs/common';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

interface ClientWithMetadata {
    clientId: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    website?: string | null;
    color?: string | null;
    redirectUris: string[];
    isFirstParty: boolean;
}

@Injectable()
export class AppsService {
    private readonly logger = new Logger(AppsService.name);

    constructor(private oauthClientRepo: OAuthClientRepository) { }

    // Seeding logic removed as per user request


    async getSystemApps() {
        const clients = await this.oauthClientRepo.findFirstParty() as ClientWithMetadata[];
        return clients.map(client => ({
            id: client.clientId,
            name: client.name,
            description: client.description || '',
            icon: client.icon || 'HelpCircle',
            url: client.website || '',
            color: client.color || '#03CD8C'
        }));
    }

    async getApps(userId: string) {
        const { firstParty, consents } = await this.oauthClientRepo.getAppsForUser(userId);

        // Map consents to a quick lookup
        const consentMap = new Map<string, typeof consents[0]>();
        consents.forEach(c => consentMap.set(c.clientId, c));

        // Combine all relevant apps
        const allClients = [...firstParty] as ClientWithMetadata[];
        consents.forEach(c => {
            if (!allClients.find(a => a.clientId === c.clientId)) {
                allClients.push(c.client);
            }
        });

        // Transform to frontend model
        return allClients.map(app => {
            const consent = consentMap.get(app.clientId);
            const status = consent ? 'Connected' : 'Disconnected';

            // Construct Launch URL (Redirect to Authorize)
            const redirectUri = app.redirectUris[0] || '';
            const launchUrl = `/auth/authorize?client_id=${app.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email`;

            return {
                key: app.clientId,
                name: app.name,
                tagline: app.description || 'EVzone Integrated App',
                status,
                lastUsedAt: Date.now(), // Placeholder
                launchUrl
            };
        });
    }

    async getConnectedApps(userId: string) {
        // Return only apps that the user has explicitly connected to (has consent)
        const { firstParty, consents } = await this.oauthClientRepo.getAppsForUser(userId);

        // Build a map of consented client IDs
        const consentedClientIds = new Set(consents.map(c => c.clientId));

        // Include first-party apps only if user has used them (has consent)
        // For first-party apps, check if they have been accessed
        const connectedApps: ClientWithMetadata[] = [];

        // Add first-party apps that have consent
        firstParty.forEach(app => {
            if (consentedClientIds.has(app.clientId)) {
                connectedApps.push(app);
            }
        });

        // Add third-party apps that have consent
        consents.forEach(c => {
            if (!connectedApps.find(a => a.clientId === c.clientId)) {
                connectedApps.push(c.client);
            }
        });

        // Transform to frontend model
        return connectedApps.map(app => {
            // Construct Launch URL (Redirect to Authorize)
            const redirectUri = app.redirectUris[0] || '';
            const launchUrl = `/auth/authorize?client_id=${app.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid profile email`;

            return {
                key: app.clientId,
                name: app.name,
                tagline: app.description || 'EVzone Integrated App',
                status: 'Connected' as const,
                lastUsedAt: Date.now(), // Placeholder - could use consent.grantedAt
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
