import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '../../repos/organizations/organization.repository';
import { OrgInviteRepository } from '../../repos/organizations/invite.repository';
import { OrgDomainRepository } from '../../repos/organizations/domain.repository';
import { OrgSSORepository } from '../../repos/organizations/sso.repository';
import { IOrganizationWithRelations } from '../../common/interfaces/organization.interface';
import { Prisma } from '@prisma/client';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class OrganizationService {
    constructor(
        private repo: OrganizationRepository,
        private inviteRepo: OrgInviteRepository,
        private domainRepo: OrgDomainRepository,
        private ssoRepo: OrgSSORepository,
        private emailService: EmailService
    ) { }

    async createOrg(userId: string, data: { name: string; country?: string }) {
        // Create Org
        const org = await this.repo.create({
            name: data.name,
            type: 'individual', // Default for now
            domain: null, // Optional
            country: data.country,
            metadata: { country: data.country }
        });

        // Add creator as Owner
        await this.repo.addMember(org.id, userId, 'Owner');
        return org;
    }

    async getUserOrgs(userId: string) {
        const memberships = await this.repo.getUserOrgs(userId);
        return memberships.map(m => ({
            ...m.organization,
            role: m.role,
            joinedAt: m.joinedAt
        }));
    }

    async getOrg(orgId: string, userId?: string) {
        // 1. Fetch Org with Members (to find my role)
        const orgData = await this.repo.findById(orgId);
        if (!orgData) throw new NotFoundException('Organization not found');
        const org = orgData as unknown as IOrganizationWithRelations;

        // 2. Fetch Stats
        const membersByRole = await this.repo.getMembersByRole(orgId);

        // 3. Determine my role
        let myRole = 'Viewer';
        if (userId && org.members) {
            const membership = org.members.find((m) => m.userId === userId);
            if (membership) myRole = membership.role;
        }

        // 4. Parse Metadata
        const meta = org.metadata || {};

        // 5. Parse Wallet
        const wallet = org.wallets?.[0]; // Relation loaded by repo
        const walletBalance = wallet ? Number(wallet.balance) : 0;
        const walletCurrency = wallet ? wallet.currency : (meta.currency || 'USD');

        // 6. Parse Audit Logs
        const auditHighlights = (org.auditLogs || []).map((log) => ({
            id: log.id,
            when: new Date(log.createdAt).getTime(),
            actor: log.actorName || (log.user?.firstName || 'System'), // Fallback if no actorName
            action: log.action,
            severity: log.severity || 'info'
        }));

        // 7. Dynamic Counts
        const pendingInvitesCount = (await this.inviteRepo.findPending(orgId)).length;

        return {
            id: org.id,
            name: org.name,
            role: myRole,
            country: org.country || meta.country || 'Unknown',
            createdAt: new Date(org.createdAt).getTime(),
            membersCount: org.members?.length || 0,
            membersByRole: membersByRole,
            pendingInvites: pendingInvitesCount,
            ssoEnabled: org.ssoEnabled,
            ssoDomains: org.ssoDomains || [],
            walletEnabled: org.walletEnabled, // Explicit flag
            currency: walletCurrency,
            currencySymbol: walletCurrency === 'USD' ? '$' : walletCurrency, // Simple fallback
            walletBalance: walletBalance,
            walletMonthlyLimit: wallet ? Number(wallet.monthlyLimit || 0) : 0,
            auditHighlights: auditHighlights,
            // Expose metadata for settings
            logoDataUrl: meta.logoDataUrl,
            address: meta.address,
            defaultRolePolicy: meta.defaultRolePolicy
        };
    }

    async getMembers(orgId: string) {
        const members = await this.repo.getMembers(orgId);
        return members.map(m => ({
            id: m.userId,
            name: (m.user.firstName || '') + ' ' + (m.user.otherNames || ''),
            email: m.user.email,
            avatarUrl: m.user.avatarUrl,
            role: m.role,
            status: m.status, // ACTIVE or PENDING
            joinedAt: m.joinedAt.getTime()
        }));
    }

    async updateMember(orgId: string, userId: string, data: { role?: string; status?: string }) {
        if (data.role) await this.repo.updateMemberRole(orgId, userId, data.role);
        if (data.status) await this.repo.updateMemberStatus(orgId, userId, data.status);
        return { success: true };
    }

    async removeMember(orgId: string, userId: string) {
        return this.repo.removeMember(orgId, userId);
    }

    async createOrgWallet(orgId: string, currency: string = 'USD') {
        const org = await this.repo.findById(orgId);
        if (!org) throw new NotFoundException('Organization not found');

        // Enable wallet flag on org
        await this.repo.update(orgId, { walletEnabled: true });

        // Create the actual wallet
        return this.repo.createWallet(orgId, currency);
    }

    async getPermissions(orgId: string) {
        const orgData = await this.repo.findById(orgId);
        if (!orgData) throw new NotFoundException('Organization not found');
        const org = orgData as unknown as IOrganizationWithRelations;

        const metadata = org.metadata || {};
        return {
            grants: metadata.grants || {},
            policy: metadata.policy || {
                defaultInviteRole: 'Member',
                requireAdminApproval: false,
                requireMfaForAdmins: false
            }
        };
    }

    async updatePermissions(orgId: string, data: { grants?: Prisma.InputJsonValue; policy?: Prisma.InputJsonValue }) {
        const orgData = await this.repo.findById(orgId);
        if (!orgData) throw new NotFoundException('Organization not found');
        const org = orgData as unknown as IOrganizationWithRelations;

        const currentMetadata = org.metadata || {};
        const newMetadata = {
            ...currentMetadata,
            grants: data.grants || currentMetadata.grants,
            policy: data.policy || currentMetadata.policy
        };

        return this.repo.update(orgId, { metadata: newMetadata });
    }

    async joinOrg(userId: string, orgId: string) {
        // For MVP, just add as Member directly (no invite flow enforced yet)
        return this.repo.addMember(orgId, userId, 'Member');
    }

    // --- Settings ---
    async updateSettings(orgId: string, data: {
        name?: string;
        country?: string;
        walletEnabled?: boolean;
        ssoEnabled?: boolean;
        address?: string;
        logoDataUrl?: string;
        defaultRolePolicy?: string;
    }) {
        // Data can include name, country, address, logo, defaultRolePolicy
        const updateData: Prisma.OrganizationUpdateInput = {};
        if (data.name) updateData.name = data.name;
        if (data.country) updateData.country = data.country;
        if (data.walletEnabled !== undefined) updateData.walletEnabled = data.walletEnabled;
        if (data.ssoEnabled !== undefined) updateData.ssoEnabled = data.ssoEnabled;

        // Merge metadata
        if (data.address || data.logoDataUrl || data.defaultRolePolicy) {
            const currentData = await this.repo.findById(orgId);
            const current = currentData as unknown as IOrganizationWithRelations;
            const currentMeta = current?.metadata || {};
            updateData.metadata = {
                ...currentMeta,
                ...(data.address ? { address: data.address } : {}),
                ...(data.logoDataUrl !== undefined ? { logoDataUrl: data.logoDataUrl } : {}),
                ...(data.defaultRolePolicy ? { defaultRolePolicy: data.defaultRolePolicy } : {})
            };
        }

        return this.repo.update(orgId, updateData);
    }

    // --- Invites ---
    async createInvite(orgId: string, email: string, role: string, invitedBy?: string) {
        const token = `inv_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        const invite = await this.inviteRepo.create({
            email,
            role,
            token,
            expiresAt,
            orgId
        });

        // Send Email
        const link = `${process.env.FRONTEND_URL || 'https://accounts.evzone.app'}/org-invite/accept?token=${token}`;
        try {
            await this.emailService.sendEmail(
                email,
                'You have been invited to join an organization',
                `You have been invited to join an organization on EVzone as a ${role}. Click here to accept: ${link}`,
                `<p>You have been invited to join an organization on EVzone.</p><p>Role: <strong>${role}</strong></p><p><a href="${link}">Click here to accept invite</a></p>`
            );
        } catch (e) {
            // Log but don't fail the invite creation (soft fail)
            console.error('Failed to send invite email', e);
        }

        return invite;
    }

    async getInvites(orgId: string) {
        return this.inviteRepo.findAll(orgId);
    }

    async revokeInvite(id: string) {
        return this.inviteRepo.revoke(id);
    }

    // --- Domains ---
    async addDomain(orgId: string, domain: string) {
        const token = `evz-verify-${Math.random().toString(36).substr(2, 8)}`;
        return this.domainRepo.create({
            domain,
            verificationToken: token,
            orgId
        });
    }

    async getDomains(orgId: string) {
        const domains = await this.domainRepo.findAll(orgId);
        return domains.map(d => ({
            ...d,
            recordName: `_evzone-verify.${d.domain}`,
            recordValue: `evzone-domain-verification=${d.verificationToken}`
        }));
    }

    async verifyDomain(id: string) {
        // Mock verification
        // In real life, query DNS TXT record
        const passed = Math.random() > 0.3; // 70% success for demo
        if (passed) {
            return this.domainRepo.setVerified(id);
        } else {
            await this.domainRepo.setFailed(id);
            return { status: 'FAILED' };
        }
    }

    async removeDomain(id: string) {
        return this.domainRepo.delete(id);
    }

    async updateDomain(id: string, data: Prisma.OrgDomainUpdateInput) {
        return this.domainRepo.update(id, data);
    }

    // --- SSO ---
    async getSSO(orgId: string) {
        return this.ssoRepo.findByOrgId(orgId);
    }

    async updateSSO(orgId: string, data: { provider: string; isEnabled: boolean; config?: Prisma.InputJsonValue }) {
        return this.ssoRepo.upsert(orgId, data);
    }

    // --- Custom Roles ---
    async createRole(orgId: string, data: { name: string; description?: string; permissions?: Prisma.InputJsonValue }) {
        return this.repo.createRole(orgId, data);
    }

    async getRoles(orgId: string) {
        // 1. Get system roles (hardcoded for now to match current logic)
        const systemRoles = [
            { id: 'role_owner', name: 'Owner', description: 'Full access to organization', isSystem: true, permissions: { all: true } },
            { id: 'role_admin', name: 'Admin', description: 'Can manage members and settings', isSystem: true, permissions: { manage_members: true, manage_settings: true } },
            { id: 'role_member', name: 'Member', description: 'Standard access', isSystem: true, permissions: { view_only: true } }
        ];

        // 2. Get custom roles from DB
        const customRoles = await this.repo.getRoles(orgId);

        return [...systemRoles, ...customRoles];
    }

    async updateRole(orgId: string, roleId: string, data: Prisma.OrgRoleUpdateInput) {
        return this.repo.updateRole(orgId, roleId, data);
    }

    async deleteRole(orgId: string, roleId: string) {
        return this.repo.deleteRole(orgId, roleId);
    }
}
