import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthCodeRepository } from '../../repos/users/auth-code.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { OAuthClientRepository } from '../../repos/users/oauth-client.repository';
import * as jose from 'jose';
import * as crypto from 'crypto';
import { KeyManager } from '../../utils/keys';

@Injectable()
export class OidcService {
    constructor(
        private authCodeRepo: AuthCodeRepository,
        private userFindRepo: UserFindRepository,
        private oauthClientRepo: OAuthClientRepository
    ) { }

    async getClient(clientId: string) {
        const client = await this.oauthClientRepo.findById(clientId);
        if (!client) throw new BadRequestException('Client not found');
        return client;
    }

    async grantConsent(userId: string, clientId: string, scopes: string[]) {
        return this.oauthClientRepo.createConsent(userId, clientId, scopes);
    }

    async createAuthCode(userId: string, clientId: string, redirectUri: string, codeChallenge: string, codeChallengeMethod: string) {
        // Validate Client
        const client = await this.oauthClientRepo.findById(clientId);
        if (!client) {
            throw new UnauthorizedException('Invalid client_id');
        }

        // Validate Redirect URI
        if (!client.redirectUris.includes(redirectUri)) {
            throw new UnauthorizedException('Invalid redirect_uri');
        }

        // 3. Consent Check (for 3rd party clients)
        if (!client.isFirstParty) {
            const consent = await this.oauthClientRepo.findConsent(userId, clientId);
            if (!consent) {
                // In a real system, we'd redirect to /consent here. 
                // For now, throw to block unauthorized 3rd party access.
                throw new UnauthorizedException('User consent required for this application');
            }
        }

        const code = Math.random().toString(36).substring(2, 15);
        await this.authCodeRepo.createAuthCode({
            code,
            clientId,
            userId,
            redirectUri,
            codeChallenge,
            codeChallengeMethod,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10m
        });
        return code;
    }

    async exchangeAuthCodeForTokens(code: string, codeVerifier: string, clientId: string, redirectUri: string) {
        // Validate Client
        const client = await this.oauthClientRepo.findById(clientId);
        if (!client) throw new UnauthorizedException('Invalid Client');

        const authCode = await this.authCodeRepo.findAuthCode(code);
        if (!authCode) throw new BadRequestException('Invalid code');
        if (authCode.used) throw new BadRequestException('Code already used');
        if (authCode.expiresAt < new Date()) throw new BadRequestException('Code expired');
        if (authCode.clientId !== clientId) throw new BadRequestException('Client ID mismatch'); // Simple check

        // Verify PKCE
        // S256: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        const challenge = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        if (challenge !== authCode.codeChallenge) {
            throw new BadRequestException('PKCE verification failed');
        }

        await this.authCodeRepo.updateAuthCode(code, { used: true });

        const user = await this.userFindRepo.findOneById(authCode.userId);
        if (!user) throw new UnauthorizedException('User not found');

        // Generate Tokens
        const privateKey = await KeyManager.getPrivateKey();

        const issuer = process.env.OIDC_ISSUER || 'http://localhost:3000';

        const accessToken = await new jose.SignJWT({ sub: user.id, email: user.email, iss: issuer })
            .setProtectedHeader({ alg: 'ES256', kid: 'evzone-key-1' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(privateKey);

        const idToken = await new jose.SignJWT({ sub: user.id, email: user.email, name: user.firstName, iss: issuer, aud: clientId })
            .setProtectedHeader({ alg: 'ES256', kid: 'evzone-key-1' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(privateKey);

        return {
            access_token: accessToken,
            id_token: idToken,
            token_type: 'Bearer',
            expires_in: 3600,
        };
    }
}
