import { Controller, Get, Post, Query, Body, Res, Req, BadRequestException } from '@nestjs/common';
import { OidcService } from '../../services/auth/oidc.service';
import { FastifyReply, FastifyRequest } from 'fastify';

@Controller('oauth')
export class OidcController {
    constructor(private oidcService: OidcService) { }

    @Get('.well-known/jwks.json')
    async jwks() {
        return { keys: [] }; // Mock JWKS for now
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
        // 1. Session Check (Simulated)
        const sessionUserId = (req.headers['x-user-id'] as string);
        if (!sessionUserId) {
            return res.status(401).send({ error: 'login_required', message: 'Please login first (set x-user-id header)' });
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
