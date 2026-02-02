import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserDeleteRepository {
    constructor(private prisma: PrismaService) { }

    async deleteUser(userId: string): Promise<User> {
        // Transaction to ensure cleanup of all related data
        return this.prisma.$transaction(async (tx) => {
            // Delete sessions first
            await tx.session.deleteMany({ where: { userId } });

            // Delete credentials
            await tx.userCredential.deleteMany({ where: { userId } });

            // Delete contacts
            await tx.userContact.deleteMany({ where: { userId } });

            // Delete notifications
            await tx.notification.deleteMany({ where: { userId } });

            // Delete audit logs
            await tx.auditLog.deleteMany({ where: { userId } });

            // Delete consents
            await tx.oAuthConsent.deleteMany({ where: { userId } });

            // Delete app memberships
            await tx.appMembership.deleteMany({ where: { userId } });

            // Delete household memberships
            await tx.householdMember.deleteMany({ where: { userId } });

            // Delete supervised children relationships
            await tx.childProfile.deleteMany({ where: { parentId: userId } });

            // Delete owned clients (OAuth clients)
            await tx.oAuthClient.deleteMany({ where: { ownerId: userId } });

            // Delete security reports
            await tx.securityReport.deleteMany({ where: { userId } });

            // Delete support tickets
            await tx.supportTicket.deleteMany({ where: { userId } });

            // Delete organization memberships
            await tx.orgMembership.deleteMany({ where: { userId } });

            // Finally delete user
            return tx.user.delete({
                where: { id: userId },
            });
        });
    }
}
