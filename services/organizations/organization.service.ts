import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from '../../repos/organizations/organization.repository';
import { OrgInviteRepository } from '../../repos/organizations/invite.repository';
import { OrgDomainRepository } from '../../repos/organizations/domain.repository';
import { OrgSSORepository } from '../../repos/organizations/sso.repository';

@Injectable()
export class OrganizationService {
    constructor(
        private repo: OrganizationRepository,
        private inviteRepo: OrgInviteRepository,
        private domainRepo: OrgDomainRepository,
        private ssoRepo: OrgSSORepository
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
        const org = await this.repo.findById(orgId);
        if (!org) throw new NotFoundException('Organization not found');

        // 2. Fetch Stats
        const membersByRole = await this.repo.getMembersByRole(orgId);

        // 3. Determine my role
        let myRole = 'Viewer';
        if (userId) {
            const membership = (org as any).members?.find((m: any) => m.userId === userId);
            if (membership) myRole = membership.role;
        }

        // 4. Parse Metadata
        const meta = (org.metadata as any) || {};

        // 5. Parse Wallet
        const wallet = (org as any).wallets?.[0]; // Relation loaded by repo
        const walletBalance = wallet ? Number(wallet.balance) : 0;
        const walletCurrency = wallet ? wallet.currency : (meta.currency || 'USD');

        // 6. Parse Audit Logs
        const auditHighlights = ((org as any).auditLogs || []).map((log: any) => ({
            id: log.id,
            when: log.createdAt.getTime(),
            actor: log.actorName || (log.user?.firstName || 'System'), // Fallback if no actorName
            action: log.action,
            severity: log.severity || 'info'
        }));

        // 7. Dynamic Counts
        const pendingInvitesCount = (await this.inviteRepo.findPending(orgId)).length;
        // Also include members with status 'PENDING' if mixed strategy used, but for now mostly invites

        return {
            id: org.id,
            name: org.name,
            role: myRole,
            country: (org as any).country || meta.country || 'Unknown',
            createdAt: org.createdAt.getTime(),
            membersCount: (org as any).members?.length || 0,
            membersByRole: membersByRole,
            pendingInvites: pendingInvitesCount,
            ssoEnabled: (org as any).ssoEnabled,
            ssoDomains: (org as any).ssoDomains || [],
            walletEnabled: (org as any).walletEnabled, // Explicit flag
            currency: walletCurrency,
            walletBalance: walletBalance,
            walletMonthlyLimit: wallet ? Number((wallet as any).monthlyLimit || 0) : 0,
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
        const updateData: any = {};
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
        const org = await this.repo.findById(orgId);
        if (!org) throw new NotFoundException('Organization not found');

        const metadata = (org.metadata as any) || {};
        return {
            grants: metadata.grants || {},
            policy: metadata.policy || {
                defaultInviteRole: 'Member',
                requireAdminApproval: false,
                requireMfaForAdmins: false
            }
        };
    }

    async updatePermissions(orgId: string, data: { grants?: any; policy?: any }) {
        const org = await this.repo.findById(orgId);
        if (!org) throw new NotFoundException('Organization not found');

        const currentMetadata = (org.metadata as any) || {};
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
    async updateSettings(orgId: string, data: any) {
        // Data can include name, country, address, logo, defaultRolePolicy
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.country) updateData.country = data.country;
        if (data.walletEnabled !== undefined) updateData.walletEnabled = data.walletEnabled;
        if (data.ssoEnabled !== undefined) updateData.ssoEnabled = data.ssoEnabled;

        // Merge metadata
        if (data.address || data.logoDataUrl || data.defaultRolePolicy) {
            const current = await this.repo.findById(orgId);
            const currentMeta = (current?.metadata as any) || {};
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

        return this.inviteRepo.create({
            email,
            role,
            token,
            expiresAt,
            orgId
        });
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

    async updateDomain(id: string, data: any) {
        return this.domainRepo.update(id, data);
    }

    // --- SSO ---
    async getSSO(orgId: string) {
        return this.ssoRepo.findByOrgId(orgId);
    }

    async updateSSO(orgId: string, data: { provider: string; isEnabled: boolean; config: any }) {
        return this.ssoRepo.upsert(orgId, data);
    }
}
