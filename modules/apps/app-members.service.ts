import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { AppRole } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../../services/notifications/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AppMembersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService
    ) { }

    async listMembers(clientPublicId: string, requesterId: string) {
        const clientId = await this.resolveClientId(clientPublicId);
        await this.verifyAccess(clientId, requesterId, ['SUPER_APP_ADMIN', 'REGIONAL_ADMIN', 'STAFF']);
        // Filter logic can be added here if REGIONAL_ADMIN should only see their region members
        return this.prisma.appMembership.findMany({
            where: { clientId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, otherNames: true, avatarUrl: true }
                }
            }
        });
    }

    async inviteMember(clientPublicId: string, requesterId: string, email: string, role: AppRole, region?: string) {
        const clientId = await this.resolveClientId(clientPublicId);
        const requester = await this.verifyAccess(clientId, requesterId, ['SUPER_APP_ADMIN', 'REGIONAL_ADMIN']);
        const app = await this.prisma.oAuthClient.findUnique({ where: { id: clientId } }); // Fetch app details for email

        if (requester.role === 'REGIONAL_ADMIN') {
            if (role === 'SUPER_APP_ADMIN') throw new ForbiddenException('Regional Admins cannot invite Super App Admins');
            if (region && region !== requester.region) throw new ForbiddenException('Cannot invite to a different region');
            if (!region) region = requester.region || undefined; // Auto-assign region
        }

        if (role === 'REGIONAL_ADMIN' && !region) {
            throw new BadRequestException('Region is required for Regional Admins');
        }

        let user = await this.prisma.user.findUnique({ where: { email } });
        let isNewUser = false;
        let setupToken: string | null = null;

        if (!user) {
            // Auto-create user for invitation with Setup Token
            isNewUser = true;
            setupToken = crypto.randomBytes(32).toString('hex');

            // We can store this token in VerificationRequest or similar, 
            // but for now let's reuse password reset flow or just store hash if we had a field.
            // Simplified: We'll create a VerificationRequest of type 'SETUP_PASSWORD'

            user = await this.prisma.user.create({
                data: {
                    email,
                    role: 'USER',
                    emailVerified: false
                }
            });

            await this.prisma.verificationRequest.create({
                data: {
                    identifier: email,
                    token: setupToken,
                    type: 'SETUP_PASSWORD',
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity for invite
                }
            });
        }

        // Check if already member
        const existing = await this.prisma.appMembership.findUnique({
            where: { userId_clientId: { userId: user.id, clientId } }
        });

        if (existing) {
            const updated = await this.prisma.appMembership.update({
                where: { id: existing.id },
                data: { role, region }
            });
            // Prepare Notification for existing member update
            await this.notificationsService.create(user.id, 'App Permissions Updated', `Your role in ${app?.name} has been updated to ${role}.`, 'INFO');
            return updated;
        }

        const newMembership = await this.prisma.appMembership.create({
            data: {
                userId: user.id,
                clientId,
                role,
                region
            }
        });

        // Send Email & Notification
        if (isNewUser && setupToken) {
            // Send Invite Link
            const inviteLink = `${process.env.FRONTEND_URL || 'https://myaccounts.evzone.com'}/auth/setup-password?token=${setupToken}&email=${encodeURIComponent(email)}`;
            await this.emailService.sendEmail(email, `You have been invited to ${app?.name}`, `You have been invited to manage ${app?.name} on EVzone. Click here to set up your account: ${inviteLink}`);
        } else {
            // Existing User Notification
            await this.notificationsService.create(user.id, 'New App Access', `You have been granted access to ${app?.name} as ${role}.`, 'SUCCESS');
            await this.emailService.sendEmail(email, `Access Granted: ${app?.name}`, `You have been added to the team for ${app?.name} with role ${role}. You can now access the dashboard.`);
        }

        return newMembership;
    }

    async removeMember(clientPublicId: string, requesterId: string, memberId: string) {
        const clientId = await this.resolveClientId(clientPublicId);
        const requester = await this.verifyAccess(clientId, requesterId, ['SUPER_APP_ADMIN', 'REGIONAL_ADMIN']);
        const app = await this.prisma.oAuthClient.findUnique({ where: { id: clientId } });

        const member = await this.prisma.appMembership.findUnique({ where: { id: memberId }, include: { user: true } });
        if (!member) throw new NotFoundException('Membership not found');

        // Prevent removing self? (Optional)

        if (requester.role === 'REGIONAL_ADMIN') {
            if (member.role === 'SUPER_APP_ADMIN') throw new ForbiddenException('Cannot remove Super App Admin');
            if (member.region !== requester.region) throw new ForbiddenException('Cannot remove member from another region');
        }

        await this.emailService.sendEmail(member.user.email, `Access Revoked: ${app?.name}`, `Your access to ${app?.name} has been revoked.`);

        return this.prisma.appMembership.delete({ where: { id: memberId } });
    }


    // Helper
    private async verifyAccess(clientId: string, userId: string, allowedRoles: AppRole[]): Promise<{ role: AppRole; region: string | null }> {
        // Super Admin Bypass
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role === 'SUPER_ADMIN') return { role: AppRole.SUPER_APP_ADMIN, region: null };

        const membership = await this.prisma.appMembership.findUnique({
            where: { userId_clientId: { userId, clientId } }
        });

        if (!membership || !allowedRoles.includes(membership.role)) {
            throw new ForbiddenException('Insufficient permissions for this App');
        }

        return membership;
    }

    private async resolveClientId(publicId: string): Promise<string> {
        const client = await this.prisma.oAuthClient.findUnique({
            where: { clientId: publicId },
            select: { id: true }
        });
        if (!client) throw new NotFoundException(`App with ID ${publicId} not found`);
        return client.id;
    }
}
