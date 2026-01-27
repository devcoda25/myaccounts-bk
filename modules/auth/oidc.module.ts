import { Module, Global } from '@nestjs/common';
import Provider from 'oidc-provider';
import { PrismaClient } from '@prisma/client';
import { PrismaOidcAdapter } from '../../services/auth/oidc.adapter';
import { KeyManager } from '../../utils/keys';
import { AuthModule } from './auth.module';
import { OidcInteractionController } from '../../controllers/auth/oidc-interaction.controller';
import { OIDC_PROVIDER } from './oidc.constants';
import { OidcConfiguration, OidcContext, OidcInteraction } from '../../common/interfaces/oidc.interface';

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

                const envIssuer = process.env.OIDC_ISSUER || (process.env.NODE_ENV === 'production' ? 'https://accounts.evzone.app/oidc' : 'http://localhost:3000/oidc');
                const issuer = envIssuer.replace(/\/$/, '');
                const cookieDomain = process.env.COOKIE_DOMAIN || '.evzone.app';
                const isProduction = process.env.NODE_ENV === 'production';

                console.log('================================================');
                console.log(`[OIDC] INITIALIZING V4 (COOKIE_RENAME) AT ${new Date().toISOString()}`);
                console.log(`[OIDC] ISSUER: ${issuer}`);
                console.log(`[OIDC] ENV: ${process.env.NODE_ENV}`);
                console.log('================================================');

                const isSecure = issuer.startsWith('https');

                const configuration: OidcConfiguration = {
                    adapter: PrismaOidcAdapter,
                    formats: {
                        AccessToken: 'jwt',
                    },
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
                    // [Fix] Explicit TTLs to prevent premature expiration during login flow
                    ttl: {
                        AccessToken: (_ctx, _token, _client) => {
                            return 60 * 60 * 24; // 24 hours (seconds)
                        },
                        AuthorizationCode: (_ctx, _token, _client) => {
                            return 60 * 10; // 10 minutes
                        },
                        IdToken: (_ctx, _token, _client) => {
                            return 60 * 60; // 1 hour
                        },
                        DeviceCode: (_ctx, _token, _client) => {
                            return 60 * 10; // 10 minutes
                        },
                        Grant: (_ctx, _token, _client) => {
                            return 60 * 60 * 24 * 14; // 14 days
                        },
                        Interaction: (_ctx, _token, _client) => {
                            return 60 * 60; // 1 hour (allow time for user to login)
                        },
                        Session: (_ctx, _token, _client) => {
                            return 60 * 60 * 24 * 14; // 14 days (Remember Me)
                        },
                    },
                    jwks: {
                        keys: [signingKey]
                    },
                    // Cookies must be secure in prod, none/lax settings handled by provider?
                    cookies: {
                        keys: [process.env.COOKIE_SECRET || 'changeme_min_32_chars_random_string_required'],
                        names: {
                            session: '_session',
                            interaction: '_interaction',
                            resume: '_resume',
                        },
                        short: {
                            path: '/',
                            domain: cookieDomain,
                            sameSite: 'lax',
                            // [Fix] Force Secure: true in production, regardless of ctx.secure detection (SSL terminated at proxy)
                            secure: isProduction
                        },
                        long: {
                            path: '/',
                            domain: cookieDomain,
                            sameSite: 'lax',
                            secure: isProduction
                        },
                    },
                    pkce: { required: () => true }, // Force PKCE

                    // [CORS] Explicitly allow trusted origins to bypass oidc-provider strictness
                    clientBasedCORS: (_ctx, origin, _client) => {
                        const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
                        const trusted = [
                            'https://accounts.evzone.app', // Production UI
                            'https://api.evzone.app',      // Production API
                            ...allowedOrigins
                        ];
                        // Allow if origin is trusted OR if we are not in production
                        return trusted.includes(origin) || process.env.NODE_ENV !== 'production';
                    },
                    interactions: {
                        url(_ctx, interaction) {
                            // This is the relative path (to issuer) where the user browser is redirected
                            // oidc-provider appends /interaction/:uid
                            // Since our issuer is https://accounts.evzone.app/oidc,
                            // The provider will generate https://accounts.evzone.app/oidc/interaction/:uid
                            // We just need to make sure we return the correct path if we override.
                            // By default it is /interaction/:uid

                            // If issuer has path component (which it does: /oidc), then default behavior:
                            // Url is issuer + /interaction/:uid
                            // So it SHOULD become https://accounts.evzone.app/oidc/interaction/:uid
                            // If it is NOT, it might be because the request hostname logic mismatch.
                            // Let's force it relative to the mount point.

                            return `/interaction/${interaction.uid}`;
                        }
                    },
                    async findAccount(ctx: OidcContext, id: string) {
                        const user = await prisma.user.findUnique({
                            where: { id },
                            include: {
                                appMemberships: true,
                                orgMemberships: {
                                    include: {
                                        organization: true
                                    }
                                }
                            }
                        });

                        if (!user) return undefined;

                        return {
                            accountId: id,
                            async claims() {
                                return {
                                    sub: id,
                                    email: user.email,
                                    email_verified: user.emailVerified,
                                    name: user.firstName ? `${user.firstName} ${user.otherNames || ''}`.trim() : user.email,
                                    given_name: user.firstName,
                                    family_name: user.otherNames,
                                    picture: user.avatarUrl,
                                    // Custom EVzone Claims: App-specific role
                                    app_role: user.role === 'SUPER_ADMIN'
                                        ? 'SUPER_APP_ADMIN'
                                        : (ctx.oidc?.client?.clientId)
                                            ? user.appMemberships.find((m: any) => m.clientId === ctx.oidc.client?.clientId)?.role || 'USER'
                                            : 'USER',
                                    global_role: user.role, // SUPER_ADMIN, ADMIN, USER
                                    // Organizations for Corporate Pay
                                    orgs: user.orgMemberships.map((m: any) => ({
                                        id: m.orgId,
                                        name: m.organization?.name,
                                        role: m.role,
                                    }))
                                };
                            },
                        };
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
