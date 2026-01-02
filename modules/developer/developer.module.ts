import { Module } from '@nestjs/common';
import { DeveloperController } from '../../controllers/developer/developer.controller';
import { DeveloperService } from '../../services/developer/developer.service';
import { PrismaModule } from '../../prisma-lib/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DeveloperController],
    providers: [DeveloperService],
    exports: [DeveloperService],
})
export class DeveloperModule { }
