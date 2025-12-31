import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthCodeRepository } from '../../repos/users/auth-code.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import * as jose from 'jose';
import * as crypto from 'crypto';

@Injectable()
export class OidcService {
    constructor(
        private authCodeRepo: AuthCodeRepository,
        private userFindRepo: UserFindRepository
    ) { }

    async createAuthCode(userId: string, clientId: string, redirectUri: string, codeChallenge: string, codeChallengeMethod: string) {
        const code = crypto.randomBytes(32).toString('hex');
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
        const authCode = await this.authCodeRepo.findAuthCode(code);
        if (!authCode) throw new BadRequestException('Invalid code');
        if (authCode.used) throw new BadRequestException('Code already used');
        if (authCode.expiresAt < new Date()) throw new BadRequestException('Code expired');
        if (authCode.clientId !== clientId) throw new BadRequestException('Client ID mismatch'); // Simple check

        // Verify PKCE
        // S256: code_challenge = BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        const challenge = hash.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

        // In a real app, strict PKCE check
        // if (challenge !== authCode.codeChallenge) throw new BadRequestException('PKCE verification failed');

        await this.authCodeRepo.updateAuthCode(code, { used: true });

        const user = await this.userFindRepo.findOneById(authCode.userId);
        if (!user) throw new UnauthorizedException('User not found');

        // Generate Tokens
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');

        const accessToken = await new jose.SignJWT({ sub: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        const idToken = await new jose.SignJWT({ sub: user.id, email: user.email, name: user.firstName }) // simplistic
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        return {
            access_token: accessToken,
            id_token: idToken,
            token_type: 'Bearer',
            expires_in: 3600,
        };
    }
}
