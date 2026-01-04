import { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
    sub: string;
    email: string;
    role: string;
    jti?: string;
}

export interface AuthRequest extends FastifyRequest {
    user: AuthenticatedUser;
}
