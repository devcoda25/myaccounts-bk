import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { EventPattern, OrgCreatedEventPayload, OrgMembershipUpdatedEventPayload, BaseEvent } from '../../common/interfaces/events.interface';

@Injectable()
export class OrgSyncService implements OnModuleInit {
    private readonly logger = new Logger(OrgSyncService.name);

    constructor(
        private kafka: KafkaService,
        private prisma: PrismaService,
    ) { }

    async onModuleInit() {
        // Subscribe to Organization events from the external "Organisation App"
        await this.kafka.subscribe(EventPattern.ORG_CREATED, async (event: BaseEvent<OrgCreatedEventPayload>) => {
            await this.handleOrgCreated(event.payload);
        });

        await this.kafka.subscribe(EventPattern.ORG_MEMBERSHIP_UPDATED, async (event: BaseEvent<OrgMembershipUpdatedEventPayload>) => {
            await this.handleMembershipUpdated(event.payload);
        });

        await this.kafka.subscribe(EventPattern.ORG_MEMBERSHIP_DELETED, async (event: BaseEvent<{ orgId: string, userId: string }>) => {
            await this.handleMembershipDeleted(event.payload);
        });
    }

    private async handleOrgCreated(payload: OrgCreatedEventPayload) {
        this.logger.log(`Syncing Org: ${payload.name} (${payload.orgId})`);
        try {
            await (this.prisma as any).organization.upsert({
                where: { id: payload.orgId },
                create: {
                    id: payload.orgId,
                    name: payload.name,
                    taxId: payload.taxId,
                    icon: payload.icon,
                },
                update: {
                    name: payload.name,
                    taxId: payload.taxId,
                    icon: payload.icon,
                }
            });
        } catch (error) {
            this.logger.error(`Failed to handle ORG_CREATED: ${error.message}`);
        }
    }

    private async handleMembershipUpdated(payload: OrgMembershipUpdatedEventPayload) {
        this.logger.log(`Syncing Membership: User ${payload.userId} in Org ${payload.orgId}`);
        try {
            await (this.prisma as any).orgMembership.upsert({
                where: {
                    orgId_userId: {
                        orgId: payload.orgId,
                        userId: payload.userId,
                    }
                },
                create: {
                    orgId: payload.orgId,
                    userId: payload.userId,
                    role: payload.role as any,
                },
                update: {
                    role: payload.role as any,
                }
            });
        } catch (error) {
            this.logger.error(`Failed to handle ORG_MEMBERSHIP_UPDATED: ${error.message}`);
        }
    }

    private async handleMembershipDeleted(payload: { orgId: string, userId: string }) {
        this.logger.log(`Removing Membership: User ${payload.userId} from Org ${payload.orgId}`);
        try {
            await (this.prisma as any).orgMembership.deleteMany({
                where: {
                    orgId: payload.orgId,
                    userId: payload.userId,
                }
            });
        } catch (error) {
            this.logger.error(`Failed to handle ORG_MEMBERSHIP_DELETED: ${error.message}`);
        }
    }
}
