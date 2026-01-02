import { Module } from '@nestjs/common';
import { ParentalController } from '../../controllers/parental/parental.controller';
import { ParentalService } from '../../services/parental/parental.service';
import { ChildProfileRepository } from '../../repos/parental/child-profile.repository';
import { HouseholdRepository } from '../../repos/parental/household.repository';
import { ParentalApprovalRepository } from '../../repos/parental/parental-approval.repository';
import { ParentalActivityRepository } from '../../repos/parental/parental-activity.repository';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [PrismaModule, AuthModule, UsersModule],
    controllers: [ParentalController],
    providers: [
        ParentalService,
        ChildProfileRepository,
        HouseholdRepository,
        ParentalApprovalRepository,
        ParentalActivityRepository,
    ],
    exports: [ParentalService],
})
export class ParentalModule { }
