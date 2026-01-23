
import { Controller, Get, Post, Req, Res, Param, Body, Inject, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import Provider from 'oidc-provider';
import { OIDC_PROVIDER } from '../../modules/auth/oidc.constants';
import { LoginService } from '../../services/auth/login.service';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { z } from 'zod';
import { OidcInteraction, OidcContext } from '../../common/interfaces/oidc.interface';

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});



@Controller('oidc/interaction')
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
        const frontendUrl = process.env.FRONTEND_URL || 'https://accounts.evzone.app';

        try {
            details = await this.provider.interactionDetails(req.raw, res.raw);
        } catch (err: any) {
            console.error(`[OIDC INTERACTION ERROR] ${uid}: ${err.message}`);
            // [DEBUG] Deep log headers and cookies
            console.error('[OIDC DEBUG] Headers:', JSON.stringify(req.raw.headers, null, 2));
            console.error('[OIDC DEBUG] RAW Cookies:', req.raw.headers.cookie || 'NONE');

            // Redirect to login with specific error message
            const signinUrl = `${frontendUrl}/auth/sign-in?interaction_error=${encodeURIComponent(err.message || 'session_expired')}`;
            return res.code(302).redirect(signinUrl);
        }
        const { prompt, params, session } = details as unknown as OidcInteraction;

        // 2. Redirect to Frontend based on Prompt
        // Ideally, configurable FRONTEND_URL

        // Auto-Consent for First-Party Client
        if (prompt.name === 'consent') {
            const clientId = params.client_id as string;
            const client = await this.prisma.oAuthClient.findUnique({ where: { clientId } });

            if (client?.isFirstParty) {
                let grantId: string;
                // Create Grant
                // @ts-ignore
                const grant = new (this.provider as any).Grant({
                    accountId: session?.accountId,
                    clientId: clientId,
                });

                const promptDetails = prompt.details;
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
        const { prompt, params, session } = interactionDetails as unknown as OidcInteraction;

        let grantId: string;

        // Create a new Grant
        // @ts-ignore
        const grant = new (this.provider as any).Grant({
            accountId: session?.accountId,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            clientId: params.client_id as string,
        });

        const details = prompt.details;
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
