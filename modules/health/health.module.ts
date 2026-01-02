import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { HealthController } from '../../controllers/health/health.controller';

@Module({
    imports: [PrismaModule],
    controllers: [HealthController],
})
export class HealthModule { }
