import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { KycService } from '../../services/kyc/kyc.service';
import { KycController } from '../../controllers/kyc/kyc.controller';

import { UserFindRepository } from '../../repos/users/user-find.repository';

@Module({
    imports: [PrismaModule],
    controllers: [KycController],
    providers: [KycService, UserFindRepository],
    exports: [KycService]
})
export class KycModule { }
