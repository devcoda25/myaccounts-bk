import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { jwtVerify } from 'jose';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { AuthRequest } from '../interfaces/auth-request.interface';
import { JwkService } from '../services/jwk.service';
import { AuthCacheService } from '../services/auth-cache.service';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private prisma: PrismaService,
        private reflector: Reflector,
        private jwkService: JwkService, // [Performance] Injected Singleton
        private authCache: AuthCacheService // [Performance] Redis Cache
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<AuthRequest>();
        const token = this.extractToken(request);
        if (!token) {
            this.logger.warn(`[AuthGuard] No token found in request headers or cookies for path: ${request.url}`);
            throw new UnauthorizedException();
        }
        try {
            // [Performance] Use cached KeyObject (Zero CPU overhead)
            const publicKey = this.jwkService.getPublicKey();

            const { payload } = await jwtVerify(token, publicKey, {
                algorithms: ['ES256'],
                clockTolerance: 30, // [Fix] Allow 30s clock skew
            });

            // [Security] Rule E: Session Revocation Check
            if (payload.jti) {
                // 1. Check Custom Auth Session (Cache-Aside)
                const sessionId = payload.jti as string;

                // Cache Check
                const cachedSession = await this.authCache.getSession(sessionId);
                if (cachedSession) {
                    if (!cachedSession.isValid) {
                        this.logger.warn(`Session ${sessionId} is marked invalid in Cache.`);
                        throw new UnauthorizedException('Session revoked');
                    }
                    // Get User from Cache
                    const cachedUser = await this.authCache.getUser(cachedSession.userId);
                    if (cachedUser) {
                        request.user = {
                            id: cachedUser.id,
                            sub: cachedUser.id,
                            email: cachedUser.email,
                            role: cachedUser.role || 'USER',
                            jti: sessionId,
                        };
                        return true;
                    }
                }

                // Cache Miss - DB Fallback
                const session = await this.prisma.session.findUnique({
                    where: { id: sessionId }
                });

                if (session) {
                    // Populate Cache
                    if (session.expiresAt > new Date()) {
                        await this.authCache.setSession({ id: session.id, userId: session.userId, isValid: true });
                        // Fetch User for Cache
                        const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
                        if (user) {
                            await this.authCache.setUser(user);
                            request.user = {
                                id: user.id,
                                sub: user.id,
                                email: user.email,
                                role: user.role || 'USER',
                                jti: sessionId,
                            };
                            return true;
                        } else {
                            this.logger.warn(`User ${session.userId} not found for valid session ${sessionId}`);
                        }
                    } else {
                        this.logger.warn(`Session ${sessionId} expired in DB. ExpiresAt: ${session.expiresAt}, Now: ${new Date()}`);
                        throw new UnauthorizedException('Session expired');
                    }
                } else {
                    // 2. Check OIDC Access Token (if custom session not found)
                    this.logger.log(`Session ${sessionId} not found in DB. Checking OIDC tokens...`);

                    const oidcToken = await this.prisma.oidcPayload.findUnique({
                        where: { id: `AccessToken:${payload.jti}` }
                    });

                    if (!oidcToken) {
                        this.logger.warn(`OIDC AccessToken:${payload.jti} not found.`);
                        throw new UnauthorizedException('Session revoked or invalid token');
                    }

                    if (oidcToken.expiresAt && oidcToken.expiresAt < new Date()) {
                        this.logger.warn(`OIDC AccessToken:${payload.jti} expired. ExpiresAt: ${oidcToken.expiresAt}`);
                        throw new UnauthorizedException('Session revoked or invalid token');
                    }
                }
            } else {
                // If no jti, fallback to user check (Legacy/Dev tokens)
                const userId = payload.sub as string;
                // Cache Check
                const cachedUser = await this.authCache.getUser(userId);
                if (cachedUser) {
                    request.user = {
                        id: cachedUser.id,
                        sub: cachedUser.id,
                        email: cachedUser.email,
                        role: cachedUser.role || 'USER',
                        jti: 'legacy',
                    };
                    return true;
                }

                const user = await this.prisma.user.findUnique({ where: { id: userId } });
                if (!user) throw new UnauthorizedException('User not found');
                await this.authCache.setUser(user);
                request.user = {
                    id: user.id,
                    sub: user.id,
                    email: user.email,
                    role: user.role || 'USER',
                    jti: 'legacy',
                };
            }

            if (!payload.sub) {
                throw new UnauthorizedException('Token missing subject');
            }

            // Should have returned by now if found via Cache/DB logic above.
            // If request.user is set, we are good.
            if (!request.user) {
                this.logger.error(`Verified signature but failed to resolve user context for sub: ${payload.sub} / jti: ${payload.jti}`);

                request.user = {
                    id: payload.sub,
                    sub: payload.sub,
                    email: payload.email as string,
                    role: payload.role as string,
                    jti: payload.jti as string,
                };
            }

        } catch (err) {
            // Fallback: Check for Opaque OIDC Token
            try {
                const oidcToken = await this.prisma.oidcPayload.findUnique({
                    where: { id: `AccessToken:${token}` }
                });

                if (oidcToken && (!oidcToken.expiresAt || oidcToken.expiresAt > new Date())) {
                    // Valid Opaque Token
                    const payload = oidcToken.payload as any;
                    if (payload && payload.accountId) {
                        const userId = payload.accountId;
                        const user = await this.prisma.user.findUnique({ where: { id: userId } });
                        if (user) {
                            request.user = {
                                id: user.id,
                                sub: user.id,
                                email: user.email,
                                role: user.role || 'USER',
                                jti: token
                            };
                            return true;
                        }
                    }
                }
            } catch (innerErr) {
                // Ignore DB error, throw original
            }

            this.logger.error(`Token verification failed: ${(err as Error).message}`, (err as Error).stack);
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractToken(request: AuthRequest): string | undefined {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return request.cookies?.evzone_token;
    }
}
