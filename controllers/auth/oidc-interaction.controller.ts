
import { Controller, Get, Post, Req, Res, Param, Body, Inject, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import Provider from 'oidc-provider';
import { OIDC_PROVIDER } from '../../modules/auth/oidc.constants';
import { LoginService } from '../../services/auth/login.service';
import { z } from 'zod';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

@Controller('interaction')
export class OidcInteractionController {
    constructor(
        @Inject(OIDC_PROVIDER) private provider: Provider,
        private loginService: LoginService,
    ) { }

    @Get(':uid')
    async interaction(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
    ) {
        // 1. Get Interaction Details
        const details = await this.provider.interactionDetails(req.raw, res.raw);
        const { prompt, params } = details;

        // 2. Redirect to Frontend based on Prompt
        // Ideally, configurable FRONTEND_URL
        const frontendUrl = 'http://localhost:5173';

        switch (prompt.name) {
            case 'login':
                return res.code(303).redirect(`${frontendUrl}/auth/login?uid=${uid}`);
            case 'consent':
                // For MVP, auto-consent or redirect to consent page
                // Let's redirect to consent page same as login but with mode
                return res.code(303).redirect(`${frontendUrl}/auth/consent?uid=${uid}`);
            default:
                return res.code(303).redirect(`${frontendUrl}/auth/login?uid=${uid}`);
        }
    }

    @Post(':uid/login')
    async login(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
        @Body() body: unknown,
    ) {
        // Validate Body
        const result = LoginSchema.safeParse(body);
        if (!result.success) {
            // If API, return 400. If Form, redirect.
            // Since frontend is SPA calling this API, 400 is fine?
            // Actually, this endpoint might be called by the frontend code via AJAX.
            // If it's AJAX, JSON response is preferred.
            // BUT oidc-provider expects a redirect/interaction finished at the end.
            // We will call provider.interactionFinished which handles the response (usually a redirect back to auth flow).
            return res.status(400).send({ error: 'Invalid input' });
        }

        const { email, password } = result.data;

        // Validate User
        const user = await this.loginService.validateUser(email, password);
        if (!user) {
            return res.status(401).send({ error: 'Invalid credentials' });
        }

        // Success - Finish Interaction
        const interactionResult = {
            login: { accountId: user.id },
        };

        // This commits the interaction and redirects the User Agent back to the Authorization Endpoint
        await this.provider.interactionFinished(req.raw, res.raw, interactionResult, { mergeWithLastSubmission: false });
    }

    @Post(':uid/confirm')
    async confirm(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
    ) {
        const interactionDetails = await this.provider.interactionDetails(req.raw, res.raw);
        // We can inspect connection.prompt.details.scopes etc.
        // For now, we assume FULL CONSENT given by the simple UI.

        const result = {
            consent: {
                // any scopes we want to reject? No.
                // any claims? No.
            },
        };

        await this.provider.interactionFinished(req.raw, res.raw, result, { mergeWithLastSubmission: true });
    }

    @Get(':uid/abort')
    async abort(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string
    ) {
        const result = {
            error: 'access_denied',
            error_description: 'User canceled the interaction',
        };
        await this.provider.interactionFinished(req.raw, res.raw, result, { mergeWithLastSubmission: false });
    }
}
