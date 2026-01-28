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
                    proxy: true, // [Fix] Trust X-Forwarded-* headers for absolute URL generation
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
                            // [Fix] Remove explicit domain to allow Host-only cookies. 
                            // This prevents browsers from rejecting cookies due to wildcard mismatches 
                            // and ensures the _session cookie binds strictly to the issuer host.
                            domain: undefined,
                            sameSite: 'lax',
                            // [Fix] Force Secure: true in production for strict browser compliance
                            secure: isProduction
                        },
                        long: {
                            path: '/',
                            domain: undefined,
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
                        try {
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
                        } catch (err: any) {
                            console.warn(`[OIDC WARNING] Rich Account Lookup failed (likely missing DB tables): ${err.message}`);
                            // Fallback to basic lookup to allow login to proceed
                            const basicUser = await prisma.user.findUnique({ where: { id } });
                            if (!basicUser) return undefined;

                            return {
                                accountId: id,
                                async claims() {
                                    return {
                                        sub: id,
                                        email: basicUser.email,
                                        email_verified: basicUser.emailVerified,
                                        name: basicUser.firstName ? `${basicUser.firstName} ${basicUser.otherNames || ''}`.trim() : basicUser.email,
                                        app_role: basicUser.role === 'SUPER_ADMIN' ? 'SUPER_APP_ADMIN' : 'USER',
                                        global_role: basicUser.role,
                                        orgs: []
                                    };
                                }
                            };
                        }
                    },
                    // [Observability] Log actual error details for "server_error"
                    renderError(ctx: any, out: any, error: any) {
                        console.error(`[OIDC SERVER ERROR] ${error.name}: ${error.message}`);
                        console.error(`[OIDC SERVER ERROR] Stack:`, error.stack);
                        ctx.type = 'html';
                        ctx.body = `<h1>Something went wrong</h1><p>${error.message}</p><p>Check server logs for trace.</p>`;
                    },
                };

                const oidc = new Provider(issuer, configuration);

                // [Phase 24] Redesign OIDC End Session Confirmation
                // Intercept the default basic UI and inject the premium EVzone theme.
                (oidc as any).use(async (ctx: any, next: any) => {
                    const originalRender = ctx.render ? ctx.render.bind(ctx) : null;
                    ctx.render = async (template: string, locals: any) => {
                        if (template === 'end_session_confirm') {
                            ctx.type = 'html';
                            ctx.body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>Sign Out Confirmation | EVzone</title>
    <style>
        :root { --ev-green: #03cd8c; --ev-orange: #f77f00; }
        body { 
            margin: 0; padding: 20px; 
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            background: radial-gradient(1200px 600px at 12% 6%, rgba(3,205,140,0.18), transparent 52%), linear-gradient(180deg, #FFFFFF 0%, #F4FFFB 60%, #ECFFF7 100%);
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            box-sizing: border-box;
        }
        @media (prefers-color-scheme: dark) {
            body { 
                background: radial-gradient(1200px 600px at 12% 6%, rgba(3,205,140,0.22), transparent 52%), linear-gradient(180deg, #04110D 0%, #07110F 60%, #07110F 100%); 
                color: #E9FFF7; 
            }
        }
        .card { 
            background: rgba(255, 255, 255, 0.4); 
            backdrop-filter: blur(20px); 
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 32px; padding: 48px; 
            max-width: 480px; width: 100%; box-shadow: 0 32px 64px rgba(0,0,0,0.06);
            text-align: center;
            animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @media (prefers-color-scheme: dark) { 
            .card { background: rgba(11, 26, 23, 0.6); border-color: rgba(233, 255, 247, 0.1); } 
        }
        .icon-box {
            width: 72px; height: 72px; border-radius: 24px;
            background: rgba(3, 205, 140, 0.1); color: var(--ev-green);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 32px;
        }
        h1 { margin: 0 0 12px; font-weight: 900; font-size: 28px; letter-spacing: -0.8px; }
        p { margin: 0 0 40px; opacity: 0.7; font-size: 16px; line-height: 1.6; }
        .btns { display: flex; flex-direction: column; gap: 14px; }
        button { 
            border: none; border-radius: 16px; padding: 16px; cursor: pointer;
            font-weight: 800; font-size: 16px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            width: 100%;
        }
        .btn-primary { 
            background: var(--ev-orange); color: white; 
            box-shadow: 0 16px 32px rgba(247, 127, 0, 0.25);
        }
        .btn-primary:hover { background: #e07300; transform: translateY(-2px); box-shadow: 0 20px 40px rgba(247, 127, 0, 0.3); }
        .btn-primary:active { transform: translateY(0); }
        .btn-secondary { 
            background: transparent; color: var(--ev-orange); 
            border: 2px solid rgba(247, 127, 0, 0.4);
            margin-top: 4px;
        }
        .btn-secondary:hover { background: rgba(247, 127, 0, 0.08); border-color: var(--ev-orange); }
        .footer { margin-top: 40px; font-size: 12px; opacity: 0.5; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon-box">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
             </svg>
        </div>
        <h1>Sign Out?</h1>
        <p>You are about to end your secure session on <b>accounts.evzone.app</b>. Do you want to continue?</p>
        <form method="post" action="${locals.action}">
            <input type="hidden" name="xsrf" value="${locals.xsrf}">
            <input type="hidden" name="logout" value="yes">
            <div class="btns">
                <button type="submit" class="btn-primary">Yes, sign me out</button>
                <button type="button" class="btn-secondary" onclick="window.history.back()">No, keep me signed in</button>
            </div>
        </form>
        <div class="footer">© ${new Date().getFullYear()} EVzone Group</div>
    </div>
</body>
</html>`;
                            return;
                        }
                        return originalRender.call(ctx, template, locals);
                    };
                    await next();
                });

                // Proxy check if behind ingress
                oidc.proxy = true;

                return oidc;
            },
        },
    ],
    exports: [OIDC_PROVIDER],
})
export class OidcModule { }
