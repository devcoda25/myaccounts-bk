import { Module, Global } from '@nestjs/common';
import Provider from 'oidc-provider';
import { PrismaClient } from '@prisma/client';
import { PrismaOidcAdapter } from '../../services/auth/oidc.adapter';
import { KeyManager } from '../../utils/keys';
import { AuthModule } from './auth.module';
import { OidcInteractionController } from '../../controllers/auth/oidc-interaction.controller';
import { OIDC_PROVIDER } from './oidc.constants';

@Global()
@Module({
    imports: [AuthModule],
    controllers: [OidcInteractionController],
    providers: [
        {
            provide: OIDC_PROVIDER,
            useFactory: async () => {
                // 1. Initialize Adapter with Prisma
                const prisma = new PrismaClient();
                PrismaOidcAdapter.setPrisma(prisma);

                // 2. Load Keys
                const signingKey = await KeyManager.getPrivateJWK();

                const issuer = process.env.OIDC_ISSUER || 'https://accounts.evzone.app';

                const configuration = {
                    adapter: PrismaOidcAdapter,

                    features: {
                        // devInteractions: { enabled: true }, // [CHANGED] Enable interactions but handled by us via routes?
                        // Actually, if we provide interaction routes, we don't need devInteractions: true.
                        // oidc-provider defaults interactions.url to /interaction/:uid
                        // We implemented /interaction/:uid
                        // usage of devInteractions is specifically for the default generic UI.
                        // We want to handle it ourselves. But 'devInteractions' feature flag might simply enable the default UI if we DONT implement it.
                        // If we implement routes, we are overriding the default behavior essentially by intercepting the ID.
                        // But we must NOT disable 'interactions' completely.
                        // 'devInteractions' false means "don't show the debug consent screen", which is what we want.
                        // So default false is correct.
                        devInteractions: { enabled: false },
                        introspection: { enabled: true },
                        revocation: { enabled: true },
                    },
                    jwks: {
                        keys: [signingKey]
                    },
                    // Cookies must be secure in prod, none/lax settings handled by provider?
                    cookies: {
                        keys: [process.env.COOKIE_SECRET || 'changeme_min_32_chars_random_string_required'],
                        short: { domain: process.env.COOKIE_DOMAIN },
                        long: { domain: process.env.COOKIE_DOMAIN },
                    },
                    pkce: { required: () => true }, // Force PKCE

                    // [CORS] Explicitly allow trusted origins to bypass oidc-provider strictness
                    clientBasedCORS: (ctx: unknown, origin: string, client: unknown) => {
                        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
                        const trusted = [
                            'https://accounts.evzone.app', // Production UI
                            'https://api.evzone.app',      // Production API
                            ...allowedOrigins
                        ];
                        // Allow if origin is trusted OR if we are not in production
                        return trusted.includes(origin) || process.env.NODE_ENV !== 'production';
                    },
                };

                const oidc = new Provider(issuer, configuration);

                // Proxy check if behind ingress
                oidc.proxy = true;

                return oidc;
            },
        },
    ],
    exports: [OIDC_PROVIDER],
})
export class OidcModule { }
