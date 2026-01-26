export interface OidcContext {
    oidc: {
        client?: {
            clientId: string;
        };
        session?: {
            accountId?: string;
        };
    };
    [key: string]: unknown;
}

export interface OidcInteraction {
    uid: string;
    prompt: {
        name: string;
        details: {
            missingOIDCScope?: string[];
            missingOIDCClaims?: string[];
            missingResourceScopes?: Record<string, string[]>;
            [key: string]: unknown;
        };
    };
    params: {
        client_id?: string;
        [key: string]: unknown;
    };
    session?: {
        accountId?: string;
    };
}

export interface OidcConfiguration {
    adapter?: any;
    clients?: any[];
    formats?: Record<string, string>;
    features?: Record<string, { enabled: boolean;[key: string]: unknown }>;
    ttl?: Record<string, (ctx: OidcContext, token: unknown, client: unknown) => number>;
    interactions?: {
        url: (ctx: OidcContext, interaction: OidcInteraction) => string | Promise<string>;
    };
    cookies?: {
        keys: string[];
        names?: {
            session?: string;
            interaction?: string;
            resume?: string;
            state?: string;
            [key: string]: string | undefined;
        };
        short?: { domain?: string; sameSite?: string; secure?: boolean; path?: string };
        long?: { domain?: string; sameSite?: string; secure?: boolean; path?: string };
    };
    jwks?: {
        keys: any[];
    };
    pkce?: { required: () => boolean };
    clientBasedCORS?: (ctx: OidcContext, origin: string, client: unknown) => boolean;
    findAccount?: (ctx: OidcContext, id: string) => Promise<any>;
    claims?: Record<string, string[]>;
}
