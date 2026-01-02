import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class EdgeGuardMiddleware implements NestMiddleware {
    private logger = new Logger(EdgeGuardMiddleware.name);

    use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
        // Skip if not an API request
        if (!req.url?.startsWith('/api')) {
            return next();
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

        next();
    }

    private getClientIp(req: any): string {
        // Handle x-forwarded-for (standard proxy header)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.socket.remoteAddress;
    }
}
