import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class OrgSSORepository {
    constructor(private prisma: PrismaService) { }

    async upsert(orgId: string, data: { provider: string; isEnabled: boolean; config: any }) {
        return this.prisma.orgSSO.upsert({
            where: { orgId },
            update: {
                provider: data.provider,
                isEnabled: data.isEnabled,
                config: data.config
            },
            create: {
                orgId,
                provider: data.provider,
                isEnabled: data.isEnabled,
                config: data.config
            }
        });
    }

    async findByOrgId(orgId: string) {
        return this.prisma.orgSSO.findUnique({
            where: { orgId }
        });
    }

    async updateStatus(orgId: string, isEnabled: boolean) {
        return this.prisma.orgSSO.update({
            where: { orgId },
            data: { isEnabled }
        });
    }
}
