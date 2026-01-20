
import { Controller, Get, Post, Req, Res, Param, Body, Inject, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import Provider from 'oidc-provider';
import { OIDC_PROVIDER } from '../../modules/auth/oidc.constants';
import { LoginService } from '../../services/auth/login.service';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { z } from 'zod';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

interface InteractionParams {
    client_id?: string;
    [key: string]: unknown;
}

interface PromptDetails {
    missingOIDCScope?: string[];
    missingOIDCClaims?: string[];
    missingResourceScopes?: Record<string, string[]>;
    [key: string]: unknown;
}

@Controller('interaction')
export class OidcInteractionController {
    constructor(
        @Inject(OIDC_PROVIDER) private provider: Provider,
        private loginService: LoginService,
        private prisma: PrismaService,
    ) { }

    @Get(':uid')
    async interaction(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
    ) {
        // 1. Get Interaction Details
        let details;
        try {
            details = await this.provider.interactionDetails(req.raw, res.raw);
        } catch (err) {
            console.error('Interaction Details Error:', err);
            // If interaction not found or cookie missing, redirect to login to start over or return 400
            if (err instanceof Error && err.message === 'interaction not found') {
                // return res.redirect('/auth/sign-in'); // Or specific error page
                // For debugging, let's bubble up but maybe user needs clearer message
            }
            throw err;
        }
        const { prompt, params, session } = details;

        // 2. Redirect to Frontend based on Prompt
        // Ideally, configurable FRONTEND_URL
        const frontendUrl = process.env.FRONTEND_URL || 'https://accounts.evzone.app';

        // Auto-Consent for First-Party Client
        if (prompt.name === 'consent') {
            const clientId = (params as InteractionParams).client_id as string;
            const client = await this.prisma.oAuthClient.findUnique({ where: { clientId } });

            if (client?.isFirstParty) {
                let grantId: string;
                // Create Grant
                // @ts-ignore
                const grant = new this.provider.Grant({
                    accountId: (session as any).accountId,
                    clientId: clientId,
                });

                const promptDetails = prompt.details as PromptDetails;
                if (promptDetails.missingOIDCScope) {
                    grant.addOIDCScope(promptDetails.missingOIDCScope.join(' '));
                }
                if (promptDetails.missingOIDCClaims) {
                    grant.addOIDCClaims(promptDetails.missingOIDCClaims);
                }
                if (promptDetails.missingResourceScopes) {
                    for (const [indicator, scopes] of Object.entries(promptDetails.missingResourceScopes)) {
                        grant.addResourceScope(indicator, (scopes as string[]).join(' '));
                    }
                }

                grantId = await grant.save();

                const result = {
                    consent: {
                        grantId,
                    },
                };

                return this.provider.interactionFinished(req.raw, res.raw, result, { mergeWithLastSubmission: true });
            }
        }

        switch (prompt.name) {
            case 'login':
                return res.code(303).redirect(`${frontendUrl}/auth/sign-in?uid=${uid}`);
            case 'consent':
                // For MVP, auto-consent or redirect to consent page
                // Let's redirect to consent page same as login but with mode
                return res.code(303).redirect(`${frontendUrl}/auth/consent?uid=${uid}`);
            default:
                return res.code(303).redirect(`${frontendUrl}/auth/sign-in?uid=${uid}`);
        }
    }


    @Get(':uid/login')
    async loginView(
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
    ) {
        const frontendUrl = process.env.FRONTEND_URL || 'https://accounts.evzone.app';
        return res.code(303).redirect(`${frontendUrl}/auth/sign-in?uid=${uid}`);
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
        try {
            await this.provider.interactionFinished(req.raw, res.raw, interactionResult, { mergeWithLastSubmission: false });
        } catch (err: any) {
            // [Fix] Handle Stale Sessions (e.g. server restart)
            // If interaction is not found or invalid, restart the flow
            if (err.message === 'invalid_request' || err.name === 'SessionNotFound') {
                return res.redirect('/auth/sign-in');
            }
            throw err;
        }
    }

    @Post(':uid/confirm')
    async confirm(
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply,
        @Param('uid') uid: string,
    ) {
        const interactionDetails = await this.provider.interactionDetails(req.raw, res.raw);
        const { prompt, params, session } = interactionDetails;

        let grantId: string;

        // Create a new Grant
        // @ts-ignore
        const grant = new this.provider.Grant({
            accountId: (session as any).accountId,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            clientId: (params as InteractionParams).client_id as string,
        });

        const details = prompt.details as PromptDetails;
        if (details.missingOIDCScope) {
            grant.addOIDCScope(details.missingOIDCScope.join(' '));
        }
        if (details.missingOIDCClaims) {
            grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
                grant.addResourceScope(indicator, (scopes as string[]).join(' '));
            }
        }

        grantId = await grant.save();

        const result = {
            consent: {
                grantId,
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
