import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('OIDC Configuration')
@Controller('/oidc/.well-known/openid-configuration')
export class OidcConfigController {
    @Get()
    @ApiOperation({ summary: 'Get OIDC Configuration' })
    getConfig() {
        const issuer = process.env.OIDC_ISSUER || 'http://localhost:3000/oidc';
        return {
            issuer: issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/token`,
            userinfo_endpoint: `${issuer}/userinfo`,
            jwks_uri: process.env.OIDC_JWKS_URI || `${issuer}/jwks`,
            end_session_endpoint: `${issuer}/logout`,
            check_session_iframe: `${issuer}/check-session`,
            revocation_endpoint: `${issuer}/revoke`,
            introspection_endpoint: `${issuer}/introspect`,
            response_types_supported: ["code"],
            subject_types_supported: ["public"],
            id_token_signing_alg_values_supported: ["ES256"],
            scopes_supported: ["openid", "email", "profile"],
            token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
            claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "name"]
        };
    }
}
