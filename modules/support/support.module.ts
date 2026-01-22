import { Module } from '@nestjs/common';
import { SupportController } from '../../controllers/support/support.controller';
import { SupportService } from '../../services/support/support.service';
import { SupportRepository } from '../../repos/support/support.repository';
import { PrismaModule } from '../../prisma-lib/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SupportController],
    providers: [SupportService, SupportRepository],
    exports: [SupportService]
})
export class SupportModule { }
