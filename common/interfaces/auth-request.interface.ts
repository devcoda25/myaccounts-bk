import { FastifyRequest } from 'fastify';

export interface AuthenticatedUser {
    id: string; // Mapped from sub
    sub: string;
    email: string;
    role: string;
    jti?: string;
}

export interface AuthRequest extends FastifyRequest {
    user: AuthenticatedUser;
}
