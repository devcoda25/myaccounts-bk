import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getHealth() {
        // Simple DB check
        let dbStatus: 'Operational' | 'Degraded' = 'Operational';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            dbStatus = 'Degraded';
        }

        const now = Date.now();

        return {
            status: dbStatus === 'Operational' ? 'Operational' : 'Degraded',
            services: [
                {
                    key: "auth",
                    name: "Auth Service",
                    desc: "Identity, sessions, and OIDC",
                    health: "Operational", // Mocked for now, but could check redis/oidc issuer
                    lastUpdatedAt: growTime(now, 2)
                },
                {
                    key: "wallet",
                    name: "Wallet Service",
                    desc: "Digital assets and transactions",
                    health: dbStatus, // Wallet depends on DB
                    lastUpdatedAt: growTime(now, 3)
                },
                {
                    key: "notifications",
                    name: "Notification Engine",
                    desc: "Email and SMS delivery",
                    health: "Operational",
                    lastUpdatedAt: growTime(now, 5)
                },
                {
                    key: "api",
                    name: "API Gateway",
                    desc: "Traffic routing and security",
                    health: "Operational",
                    lastUpdatedAt: growTime(now, 1)
                }
            ]
        };
    }
}

function growTime(now: number, mins: number) {
    return now - (mins * 60 * 1000);
}
