import { Module } from '@nestjs/common';
import { OrgSyncService } from './org-sync.service';
import { KafkaModule } from '../kafka/kafka.module';
import { PrismaModule } from '../../prisma-lib/prisma.module';

@Module({
    imports: [KafkaModule, PrismaModule],
    providers: [OrgSyncService],
    exports: [OrgSyncService],
})
export class OrgsModule { }
