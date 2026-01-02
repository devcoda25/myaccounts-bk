import { Module } from '@nestjs/common';
import { DebugController } from '../../controllers/debug/debug.controller';
import { PrismaModule } from '../../prisma-lib/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DebugController],
})
export class DebugModule { }
