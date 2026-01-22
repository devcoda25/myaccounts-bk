import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AdminRepository } from '../../repos/admin/admin.repository';
import { AdminService } from '../../services/admin/admin.service';
import { AdminController } from '../../controllers/admin/admin.controller';
import { AdminAppsController } from '../../controllers/admin/admin-apps.controller';

@Module({
    imports: [PrismaModule],
    providers: [AdminRepository, AdminService],
    controllers: [AdminController, AdminAppsController],
    exports: [AdminService]
})
export class AdminModule { }
