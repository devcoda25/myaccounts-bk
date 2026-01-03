import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class EdgeGuard implements CanActivate {
    private logger = new Logger(EdgeGuard.name);

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<FastifyRequest>();

        // Skip if not an API request
        if (!req.url?.startsWith('/api')) {
            return true;
        }

        // 1. IP Allowlist Guard
        if (process.env.ENFORCE_IP_ALLOWLIST === 'true') {
            const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim());
            const clientIp = this.getClientIp(req);

            if (!allowedIps.includes(clientIp)) {
                this.logger.warn(`Blocked request from unauthorized IP: ${clientIp}`);
                throw new ForbiddenException('Access denied');
            }
        }

        // 2. API Key Guard
        if (process.env.ENFORCE_API_KEY === 'true') {
            const validKeys = (process.env.VALID_API_KEYS || '').split(',').map(k => k.trim());
            const apiKey = req.headers['x-api-key'] as string;

            if (!apiKey || !validKeys.includes(apiKey)) {
                this.logger.warn(`Blocked request with invalid API Key`);
                throw new ForbiddenException('Invalid API Key');
            }
        }

        return true;
    }

    private getClientIp(req: FastifyRequest): string {
        // Handle x-forwarded-for (standard proxy header)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            if (Array.isArray(forwarded)) {
                return forwarded[0].trim();
            }
            return forwarded.split(',')[0].trim();
        }
        return req.socket.remoteAddress || '';
    }
}
