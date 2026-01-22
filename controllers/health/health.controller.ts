import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../modules/redis/redis.module';
import { EmailService } from '../../services/notifications/email.service';

@Public()
@Controller('health')
export class HealthController {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        @Inject(REDIS_CLIENT) private redis: Redis
    ) { }

    @Get()
    async getHealth() {
        // 1. DB Check
        let dbStatus: 'Operational' | 'Degraded' = 'Operational';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            dbStatus = 'Degraded';
        }

        // 2. Auth (Redis) Check
        let authStatus: 'Operational' | 'Degraded' = 'Operational';
        try {
            const pong = await this.redis.ping();
            if (pong !== 'PONG') authStatus = 'Degraded';
        } catch (e) {
            authStatus = 'Degraded';
        }

        // 3. Notifications (Email) Check
        const notifStatus = await this.emailService.checkHealth();

        // 4. OIDC Discovery Check (Regression Prevention)
        let oidcStatus: 'Operational' | 'Degraded' = 'Operational';
        try {
            // We fetch the issuer from ENV and append discovery path
            const issuer = (process.env.OIDC_ISSUER || 'https://accounts.evzone.app/oidc').replace(/\/$/, '');
            const discoveryUrl = `${issuer}/.well-known/openid-configuration`;

            const response = await fetch(discoveryUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(3000) // Don't hang the health check
            });

            if (!response.ok) {
                console.error(`[HEALTH] OIDC Discovery failed with status: ${response.status}`);
                oidcStatus = 'Degraded';
            } else {
                const data = await response.json();
                if (!data.issuer) oidcStatus = 'Degraded';
            }
        } catch (e: any) {
            console.error(`[HEALTH] OIDC Discovery Error: ${e.message}`);
            oidcStatus = 'Degraded';
        }

        // 5. API (Self) Check
        // If we are here, API is responsive.
        const apiStatus = 'Operational';

        const now = Date.now();

        // Determine overall
        const status = (dbStatus === 'Operational' && authStatus === 'Operational' && notifStatus === 'Operational' && oidcStatus === 'Operational')
            ? 'Operational'
            : 'Degraded';

        return {
            status,
            services: [
                {
                    key: "auth",
                    name: "Auth Service",
                    desc: "Identity, sessions, and OIDC",
                    health: authStatus,
                    lastUpdatedAt: growTime(now, 2)
                },
                {
                    key: "oidc",
                    name: "OIDC Provider",
                    desc: "Protocol discovery and keys",
                    health: oidcStatus,
                    lastUpdatedAt: growTime(now, 1)
                },
                {
                    key: "notifications",
                    name: "Notification Engine",
                    desc: "Email and SMS delivery",
                    health: notifStatus,
                    lastUpdatedAt: growTime(now, 5)
                },
                {
                    key: "api",
                    name: "API Gateway",
                    desc: "Traffic routing and security",
                    health: apiStatus,
                    lastUpdatedAt: growTime(now, 1)
                }
            ]
        };
    }
}

function growTime(now: number, mins: number) {
    return now - (mins * 60 * 1000);
}
