import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Injectable()
export class EdgeGuard implements CanActivate {
    private readonly logger = new Logger(EdgeGuard.name);
    private readonly enforceIpAllowlist: boolean;
    private readonly allowedIps: string[];
    private readonly enforceApiKey: boolean;
    private readonly validKeys: string[];

    constructor() {
        this.enforceIpAllowlist = process.env.ENFORCE_IP_ALLOWLIST === 'true';
        this.allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim());

        this.enforceApiKey = process.env.ENFORCE_API_KEY === 'true';
        this.validKeys = (process.env.VALID_API_KEYS || '').split(',').map(k => k.trim());
    }

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<FastifyRequest>();

        // Skip if not an API request
        if (!req.url?.startsWith('/api')) {
            return true;
        }

        // 1. IP Allowlist Guard
        if (this.enforceIpAllowlist) {
            const clientIp = this.getClientIp(req);

            if (!this.allowedIps.includes(clientIp)) {
                this.logger.warn(`Blocked request from unauthorized IP: ${clientIp}`);
                throw new ForbiddenException('Access denied');
            }
        }

        // 2. API Key Guard
        if (this.enforceApiKey) {
            const apiKey = req.headers['x-api-key'] as string;

            if (!apiKey || !this.validKeys.includes(apiKey)) {
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
