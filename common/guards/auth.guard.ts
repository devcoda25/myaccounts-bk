import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { jwtVerify } from 'jose';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { AuthRequest } from '../interfaces/auth-request.interface';
import { JwkService } from '../services/jwk.service';
import { AuthCacheService, CachedSession } from '../services/auth-cache.service';

// Extend CachedSession to include user data for Redis-first strategy
interface CachedSessionWithUser extends CachedSession {
    userData: {
        id: string;
        email: string;
        role: string;
    } | null;
}

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(
        private prisma: PrismaService,
        private reflector: Reflector,
        private jwkService: JwkService,
        private authCache: AuthCacheService
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
                clockTolerance: 30,
                audience: process.env.JWT_AUDIENCE || 'evzone-myaccounts',
            });

            // [Security] Validate issuer
            const expectedIssuer = process.env.JWT_ISSUER || 'https://accounts.evzone.app';
            if (payload.iss !== expectedIssuer) {
                this.logger.warn(`Invalid issuer: ${payload.iss} != ${expectedIssuer}`);
                throw new UnauthorizedException('Invalid token issuer');
            }

            // [Scalability] Redis-first strategy with pipeline for single round-trip
            if (payload.jti) {
                const sessionId = payload.jti as string;

                // Try to get session and user in single Redis pipeline operation
                const cachedData = await this.getSessionWithUserFromCache(sessionId);

                if (cachedData) {
                    if (!cachedData.isValid) {
                        this.logger.warn(`Session ${sessionId} is marked invalid in Cache.`);
                        throw new UnauthorizedException('Session revoked');
                    }

                    if (cachedData.userData) {
                        request.user = {
                            id: cachedData.userData.id,
                            sub: cachedData.userData.id,
                            email: cachedData.userData.email,
                            role: cachedData.userData.role || 'USER',
                            jti: sessionId,
                        };
                        return true;
                    }
                }

                // Cache miss - fallback to DB with optimized query
                await this.handleCacheMissSession(sessionId, request);
            } else {
                // Legacy token handling
                const userId = payload.sub as string;
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

    /**
     * [Scalability] Get session and user data in single Redis pipeline round-trip
     * This reduces 2 Redis calls to 1, significantly improving performance at 1M concurrent users
     */
    private async getSessionWithUserFromCache(sessionId: string): Promise<CachedSessionWithUser | null> {
        try {
            const redis = (this.authCache as any).redis;
            const sessionKey = `session:${sessionId}`;
            const userKey = `user:${sessionId}`; // We store user data in session hash or separately

            // Use pipeline for batch operations
            const pipeline = redis.pipeline();
            pipeline.get(sessionKey);
            pipeline.get(userKey);

            const results = await pipeline.exec();

            if (results && results.length >= 2) {
                const sessionData = results[0][1];
                const userData = results[1][1];

                if (sessionData) {
                    const session = JSON.parse(sessionData as string) as CachedSession;
                    let userObj = null;

                    if (userData) {
                        try {
                            const user = JSON.parse(userData as string);
                            userObj = {
                                id: user.id,
                                email: user.email,
                                role: user.role || 'USER'
                            };
                        } catch (e) {
                            // Invalid user data, ignore
                        }
                    }

                    return {
                        ...session,
                        userData: userObj
                    };
                }
            }
        } catch (error) {
            this.logger.error(`Redis pipeline error: ${(error as Error).message}`);
        }
        return null;
    }

    /**
     * [Scalability] Handle cache miss with optimized DB query
     * Uses Prisma's include to fetch session and user in single query
     */
    private async handleCacheMissSession(sessionId: string, request: AuthRequest): Promise<void> {
        // [Scalability] Use single optimized query instead of N+1
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });

        if (!session) {
            // Check OIDC tokens
            const oidcToken = await this.prisma.oidcPayload.findUnique({
                where: { id: `AccessToken:${sessionId}` }
            });

            if (!oidcToken) {
                throw new UnauthorizedException('Session revoked or invalid token');
            }

            if (oidcToken.expiresAt && oidcToken.expiresAt < new Date()) {
                throw new UnauthorizedException('Session revoked or invalid token');
            }
            return;
        }

        // [Scalability] Only populate cache if session is valid and not expired
        if (session.expiresAt > new Date()) {
            // Populate both session and user in cache (single cache operation)
            const sessionCache = {
                id: session.id,
                userId: session.userId,
                isValid: true
            };

            // Store minimal user data needed for auth
            const userCache = {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role || 'USER'
            };

            // Set both in parallel
            await Promise.all([
                this.authCache.setSession(sessionCache),
                this.authCache.setUser(session.user as any)
            ]);

            request.user = {
                id: session.user.id,
                sub: session.user.id,
                email: session.user.email,
                role: session.user.role || 'USER',
                jti: sessionId,
            };
        } else {
            this.logger.warn(`Session ${sessionId} expired in DB.`);
            throw new UnauthorizedException('Session expired');
        }
    }

    private extractToken(request: AuthRequest): string | undefined {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return request.cookies?.evzone_token;
    }
}
