import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma-lib/prisma.module';
import { OrganizationRepository } from '../../repos/organizations/organization.repository';
import { OrganizationService } from '../../services/organizations/organization.service';
import { OrganizationController } from '../../controllers/organizations/organization.controller';
import { OrgInviteRepository } from '../../repos/organizations/invite.repository';
import { OrgDomainRepository } from '../../repos/organizations/domain.repository';
import { OrgSSORepository } from '../../repos/organizations/sso.repository';

@Module({
    imports: [PrismaModule],
    providers: [
        OrganizationRepository,
        OrganizationService,
        OrgInviteRepository,
        OrgDomainRepository,
        OrgSSORepository
    ],
    controllers: [OrganizationController],
    exports: [OrganizationService]
})
export class OrganizationModule { }
