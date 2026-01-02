import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('OIDC Configuration')
@Controller('.well-known/openid-configuration')
export class OidcConfigController {
    @Get()
    @ApiOperation({ summary: 'Get OIDC Configuration' })
    getConfig() {
        const issuer = process.env.OIDC_ISSUER || 'http://localhost:3000';
        return {
            issuer: issuer,
            authorization_endpoint: `${issuer}/api/v1/auth/authorize`,
            token_endpoint: `${issuer}/api/v1/auth/token`,
            userinfo_endpoint: `${issuer}/api/v1/auth/userinfo`,
            jwks_uri: process.env.OIDC_JWKS_URI || `${issuer}/jwks`,
            response_types_supported: ["code"],
            subject_types_supported: ["public"],
            id_token_signing_alg_values_supported: ["ES256"],
            scopes_supported: ["openid", "email", "profile"],
            token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
            claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "name"]
        };
    }
}
