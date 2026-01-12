declare module 'oidc-provider' {
    class Provider {
        constructor(issuer: string, configuration?: any);
        callback(): (req: any, res: any, next?: any) => void;
        interactionDetails(req: any, res: any): Promise<Provider.InteractionDetails>;
        interactionFinished(req: any, res: any, result: Provider.InteractionResult, options?: { mergeWithLastSubmission?: boolean }): Promise<void>;
        proxy: boolean;
    }

    namespace Provider {
        interface InteractionDetails {
            prompt: {
                name: string;
                details?: unknown;
            };
            params: unknown;
            session?: unknown;
            uid: string;
        }

        interface InteractionResult {
            login?: {
                accountId: string;
            };
            consent?: {
                grantId?: string;
                rejectedScopes?: string[];
                rejectedClaims?: string[];
                replace?: boolean;
            };
            error?: string;
            error_description?: string;
            [key: string]: unknown;
        }

        interface AdapterPayload {
            uid?: string;
            grantId?: string;
            userCode?: string;
            kind?: string;
            jti?: string;
            exp?: number;
            iat?: number;
            [key: string]: unknown; // Safer than any
        }

        interface Adapter {
            upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void>;
            find(id: string): Promise<AdapterPayload | undefined>;
            findByUserCode(userCode: string): Promise<AdapterPayload | undefined>;
            findByUid(uid: string): Promise<AdapterPayload | undefined>;
            destroy(id: string): Promise<void>;
            revokeByGrantId(grantId: string): Promise<void>;
            consume(id: string): Promise<void>;
        }
    }

    export default Provider;
}
