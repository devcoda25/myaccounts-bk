import { Controller, Get, Post, Query, Body, Res, Req, BadRequestException, UnauthorizedException, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OidcService } from '../../services/auth/oidc.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { KeyManager } from '../../utils/keys';
import { jwtVerify, importJWK } from 'jose';

@Controller('auth')
export class OidcController {
    constructor(private oidcService: OidcService) { }

    @Get('client/:clientId')
    async getClient(@Param('clientId') clientId: string) {
        return this.oidcService.getClient(clientId);
    }

    @Post('consent')
    @UseGuards(AuthGuard)
    async grantConsent(@Body() body: { clientId: string, scopes: string[] }, @CurrentUser() user: any) {
        return this.oidcService.grantConsent(user.sub || user.id, body.clientId, body.scopes);
    }

    @Get('userinfo')
    async userinfo(@Req() req: FastifyRequest) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];
        try {
            const publicJwk = await KeyManager.getPublicJWK();
            const publicKey = await importJWK(publicJwk, 'ES256');
            const { payload } = await jwtVerify(token, publicKey, { algorithms: ['ES256'] });

            // Return standard OIDC claims
            return {
                sub: payload.sub,
                email: payload.email,
                name: payload.name || '',
                picture: payload.picture || '',
                email_verified: true // Assuming verified if they have a token in this system
            };
        } catch (e) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    @Get('authorize')
    async authorize(
        @Query('client_id') clientId: string,
        @Query('redirect_uri') redirectUri: string,
        @Query('response_type') responseType: string,
        @Query('code_challenge') codeChallenge: string,
        @Query('code_challenge_method') codeChallengeMethod: string,
        @Query('state') state: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
    ) {
        // 1. Session Check (Cookie Based)
        const token = req.cookies['access_token'];
        if (!token) {
            // Redirect to login if needed, or error
            return res.status(401).send({ error: 'login_required', message: 'Please login first' });
        }

        let sessionUserId: string;
        try {
            // Verify the OIDC session (could be same as access token for now)
            const publicJwk = await KeyManager.getPublicJWK();
            const publicKey = await importJWK(publicJwk, 'ES256');
            const { payload } = await jwtVerify(token, publicKey, { algorithms: ['ES256'] });
            sessionUserId = payload.sub;
        } catch (e) {
            return res.status(401).send({ error: 'login_required', message: 'Invalid session' });
        }

        if (responseType !== 'code') {
            throw new BadRequestException('Unsupported response_type. Use "code".');
        }
        if (!codeChallenge) {
            throw new BadRequestException('Missing code_challenge (PKCE required).');
        }

        // 2. Generate Code
        const code = await this.oidcService.createAuthCode(sessionUserId, clientId, redirectUri, codeChallenge, codeChallengeMethod || 'S256');

        // 3. Redirect
        const url = new URL(redirectUri);
        url.searchParams.set('code', code);
        if (state) url.searchParams.set('state', state);

        return res.code(302).redirect(url.toString());
    }

    @Post('token')
    async token(@Body() body: any) {
        const { grant_type, code, redirect_uri, client_id, code_verifier } = body;

        if (grant_type !== 'authorization_code') {
            throw new BadRequestException('Unsupported grant_type');
        }

        return this.oidcService.exchangeAuthCodeForTokens(code, code_verifier, client_id, redirect_uri);
    }
}
