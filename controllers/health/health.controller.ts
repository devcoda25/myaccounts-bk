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

        // 4. API (Self) Check
        // If we are here, API is responsive.
        const apiStatus = 'Operational';

        const now = Date.now();

        // Determine overall
        const status = (dbStatus === 'Operational' && authStatus === 'Operational' && notifStatus === 'Operational')
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
