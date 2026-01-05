import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AdminRepository } from '../../repos/admin/admin.repository';
import { AdminService } from '../../services/admin/admin.service';
import { AdminController } from '../../controllers/admin/admin.controller';
import { AdminKycController } from '../../controllers/admin/admin-kyc.controller';
import { KycModule } from '../kyc/kyc.module';
import { AdminDisputesRepository } from '../../repos/admin/admin-disputes.repository';
import { AdminDisputesService } from '../../services/admin/admin-disputes.service';
import { AdminDisputesController } from '../../controllers/admin/admin-disputes.controller';
import { AdminAppsController } from '../../controllers/admin/admin-apps.controller';

@Module({
    imports: [PrismaModule, KycModule],
    providers: [AdminRepository, AdminService, AdminDisputesRepository, AdminDisputesService],
    controllers: [AdminController, AdminKycController, AdminDisputesController, AdminAppsController],
    exports: [AdminService, AdminDisputesRepository]
})
export class AdminModule { }
