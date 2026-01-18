import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { jwtVerify, importJWK } from 'jose';
import { KeyManager } from '../../utils/keys';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { AuthRequest } from '../interfaces/auth-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private prisma: PrismaService, private reflector: Reflector) { }

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
            throw new UnauthorizedException();
        }
        try {
            const publicJwk = await KeyManager.getPublicJWK();
            const publicKey = await importJWK(publicJwk, 'ES256');

            const { payload } = await jwtVerify(token, publicKey, {
                algorithms: ['ES256'],
            });

            // [Security] Rule E: Session Revocation Check
            // [Security] Rule E: Session Revocation Check
            if (payload.jti) {
                // 1. Check Custom Auth Session
                const session = await this.prisma.session.findUnique({
                    where: { id: payload.jti as string }
                });

                if (session) {
                    // Valid Custom Session
                } else {
                    // 2. Check OIDC Access Token (if session not found)
                    // OIDC Provider stores AccessTokens with prefix "AccessToken:"
                    // The payload.jti from OIDC is the unique ID of the AccessToken.
                    const oidcToken = await this.prisma.oidcPayload.findUnique({
                        where: { id: `AccessToken:${payload.jti}` }
                    });

                    if (!oidcToken || (oidcToken.expiresAt && oidcToken.expiresAt < new Date())) {
                        throw new UnauthorizedException('Session revoked or invalid token');
                    }
                }
                // Check expiry logic if needed, but jwtVerify handles exp check.
            } else {
                // If no jti, fallback to user check
                const user = await this.prisma.user.findUnique({ where: { id: payload.sub as string } });
                if (!user) throw new UnauthorizedException('User not found');
            }

            if (!payload.sub) {
                throw new UnauthorizedException('Token missing subject');
            }

            request.user = {
                id: payload.sub,
                sub: payload.sub,
                email: payload.email as string,
                role: payload.role as string,
                jti: payload.jti as string,
            };
        } catch (err) {
            console.error('Token verification failed:', err);
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
