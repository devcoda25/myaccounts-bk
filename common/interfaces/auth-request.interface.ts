import { FastifyRequest } from 'fastify';

export interface AuthRequest extends FastifyRequest {
    user: {
        sub: string;
        email: string;
        role: string;
        jti?: string;
    };
}
