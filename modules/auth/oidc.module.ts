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

                const issuer = process.env.OIDC_ISSUER || 'https://accounts.evzone.app/oidc';
                console.log(`[OIDC] Initializing with Issuer: ${issuer}`);
                console.log(`[OIDC] Cookie Domain: ${process.env.COOKIE_DOMAIN || '(unset)'}`);

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
                        short: { domain: process.env.COOKIE_DOMAIN, sameSite: 'None', secure: true },
                        long: { domain: process.env.COOKIE_DOMAIN, sameSite: 'None', secure: true },
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
                    interactions: {
                        url(ctx: unknown, interaction: any) {
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
                    async findAccount(ctx: unknown, id: string) {
                        const user = await prisma.user.findUnique({
                            where: { id },
                            include: {
                                orgMemberships: {
                                    include: { organization: true }
                                }
                            }
                        });

                        if (!user) return undefined;

                        return {
                            accountId: id,
                            async claims(use, scope, claims, rejected) {
                                return {
                                    sub: id,
                                    email: user.email,
                                    email_verified: user.emailVerified,
                                    name: user.firstName ? `${user.firstName} ${user.otherNames || ''}`.trim() : user.email,
                                    given_name: user.firstName,
                                    family_name: user.otherNames,
                                    picture: user.avatarUrl,
                                    // Custom EVzone Claims
                                    orgs: user.orgMemberships.map(m => ({
                                        id: m.orgId,
                                        name: m.organization.name,
                                        role: m.role,
                                        domain: m.organization.domain
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
