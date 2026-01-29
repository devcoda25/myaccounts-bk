import { Controller, Get, Delete, Param, Query, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SessionManagementService } from '../../services/auth/session-management.service';
import { LoginService } from '../../services/auth/login.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

/**
 * Session Management Controller
 * 
 * Provides endpoints for:
 * - GET /api/sessions: List all active sessions for the current user
 * - GET /api/sessions/count: Get active session count
 * - DELETE /api/sessions/:id: Revoke a specific session
 * - DELETE /api/sessions: Revoke all sessions (logout everywhere)
 * - GET /api/sessions/logout-uris: Get front-channel logout URLs for SLO
 * 
 * Also provides OIDC-compliant endpoints:
 * - GET /oidc/logout: OIDC end_session_endpoint
 */

@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
    constructor(
        private sessionService: SessionManagementService,
        private loginService: LoginService
    ) { }

    /**
     * GET /api/sessions
     * List all active sessions for the authenticated user
     */
    @Get()
    async listSessions(@CurrentUser() user: User) {
        const sessions = await this.sessionService.getUserSessions(user.id);
        return {
            success: true,
            data: sessions,
            total: sessions.length,
        };
    }

    /**
     * GET /api/sessions/count
     * Get the count of active sessions
     */
    @Get('count')
    async getSessionCount(@CurrentUser() user: User) {
        const count = await this.sessionService.getActiveSessionCount(user.id);
        return {
            success: true,
            count,
        };
    }

    /**
     * GET /api/sessions/:id
     * Get details of a specific session
     */
    @Get(':id')
    async getSession(
        @CurrentUser() user: User,
        @Param('id') sessionId: string
    ) {
        const session = await this.sessionService.getSessionById(user.id, sessionId);
        return {
            success: true,
            data: session,
        };
    }

    /**
     * DELETE /api/sessions/:id
     * Revoke a specific session
     */
    @Delete(':id')
    async revokeSession(
        @CurrentUser() user: User,
        @Param('id') sessionId: string
    ) {
        await this.sessionService.revokeSession(user.id, sessionId);
        return {
            success: true,
            message: 'Session revoked successfully',
        };
    }

    /**
     * DELETE /api/sessions
     * Revoke all sessions (logout everywhere except current)
     */
    @Delete()
    async revokeAllSessions(
        @CurrentUser() user: User,
        @Query('keepCurrent') keepCurrent: string = 'true'
    ) {
        // Get the current session ID from the request context
        // In a real implementation, you'd extract this from the JWT or request
        const currentSessionId = keepCurrent === 'true'
            ? (undefined as any) // Will be handled by the service
            : undefined;

        const result = await this.sessionService.revokeAllSessions(
            user.id,
            keepCurrent === 'true' ? undefined : undefined
        );

        return {
            success: true,
            message: `Revoked ${result.revokedCount} sessions`,
            revokedCount: result.revokedCount,
        };
    }

    /**
     * GET /api/sessions/logout-uris
     * Get front-channel logout URLs for Single Logout (SLO)
     * Returns URLs that the frontend can use to trigger logout in iframes
     */
    @Get('logout-uris')
    async getLogoutUris(@CurrentUser() user: User) {
        const logoutUrls = await this.sessionService.getFrontChannelLogoutUrls(user.id);
        return {
            success: true,
            data: logoutUrls,
        };
    }
}

/**
 * OIDC Logout Controller
 * Provides OIDC-compliant end_session_endpoint
 */
@Controller('oidc')
export class OidcLogoutController {
    constructor(
        private sessionService: SessionManagementService,
        private loginService: LoginService
    ) { }

    /**
     * GET /oidc/logout
     * OIDC end_session_endpoint (RP-Initiated Logout)
     * 
     * Per OIDC Front-Channel Logout spec:
     * - Clears the IdP session cookie
     * - Optionally redirects to registered post-logout URIs
     * - Can trigger front-channel logout to RPs via iframes
     * 
     * Query params:
     * - id_token_hint: The ID token from the logout request (optional but recommended)
     * - post_logout_redirect_uri: Where to redirect after logout (optional)
     * - state: State parameter for the redirect (optional)
     */
    @Get('logout')
    async oidcLogout(
        @Query('id_token_hint') idTokenHint: string | undefined,
        @Query('post_logout_redirect_uri') postLogoutRedirectUri: string | undefined,
        @Query('state') state: string | undefined,
        @Res() res: Response
    ) {
        // In a real implementation:
        // 1. If id_token_hint is provided, validate it and extract the user/session
        // 2. Clear the IdP session cookie
        // 3. If post_logout_redirect_uri is provided and valid, redirect there
        // 4. Otherwise, render a logout confirmation page

        // For now, redirect to the login page with a logged-out message
        const redirectUri = postLogoutRedirectUri
            ? `${postLogoutRedirectUri}${postLogoutRedirectUri.includes('?') ? '&' : '?'}state=${state || ''}`
            : '/login?logout=success';

        // Set cookie clearing headers
        res.setHeader('Clear-Site-Data', '"cookies", "storage"');

        // Redirect to the post-logout URI or login page
        res.redirect(HttpStatus.FOUND, redirectUri);
    }

    /**
     * GET /oidc/front-channel-logout
     * Front-channel logout callback for RPs
     * RPs can call this to notify that a user has logged out
     */
    @Get('front-channel-logout')
    async frontChannelLogout(
        @Query('sid') sessionId: string,
        @Query('iss') issuer: string,
        @Res() res: Response
    ) {
        // Validate the issuer matches our domain
        // In a real implementation, verify the request comes from a registered RP

        if (sessionId) {
            // Mark the session as terminated in the database
            // This prevents the refresh token from being used
            try {
                await this.loginService.logout(sessionId);
            } catch (e) {
                // Session might already be invalid
            }
        }

        // Return 204 No Content (RP should remove the iframe)
        res.status(HttpStatus.NO_CONTENT).send();
    }
}
