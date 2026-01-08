import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from '../../repos/admin/admin.repository';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AdminCreateOAuthClientDto, AdminUpdateOAuthClientDto } from '../../common/dto/admin/admin-apps.dto';

@Injectable()
export class AdminService {
    constructor(private repo: AdminRepository) { }

    async getDashboardStats() {
        const counts = await this.repo.getCounts();
        const balance = await this.repo.getTotalWalletBalance();

        return {
            usersCount: counts.users,
            orgsCount: counts.orgs,
            sessionsCount: counts.sessions,
            balance: Number(balance)
        };
    }

    async getAuditLogs(query: { skip?: number; take?: number; query?: string; outcome?: string; risk?: string }) {
        const { logs, total } = await this.repo.getAuditLogs(
            Number(query.skip) || 0,
            Number(query.take) || 20,
            query.query,
            query.outcome,
            query.risk
        );

        const mapped = logs.map(l => {
            const riskMap: Record<string, string> = { 'critical': 'High', 'warning': 'Medium', 'info': 'Low' };
            const details = l.details as Record<string, any>;

            return {
                id: l.id,
                at: l.createdAt.getTime(),
                actor: l.actorName || l.user?.email || 'System',
                role: l.user?.role || 'N/A',
                action: l.action,
                target: details?.target || 'N/A',
                ip: l.ipAddress || '0.0.0.0',
                outcome: (details?.outcome as any) || 'Success',
                risk: riskMap[l.severity] || 'Low' as any,
                requestId: details?.requestId || 'N/A',
                meta: details || {}
            };
        });

        return { logs: mapped, total };
    }

    async getOrgs(query: { skip?: number; take?: number; query?: string; status?: string }) {
        console.log('AdminService.getOrgs called with:', query);
        const { orgs, total } = await this.repo.getOrgs(
            Number(query.skip) || 0,
            Number(query.take) || 20,
            query.query,
            query.status
        );
        console.log(`Repo returned ${orgs.length} orgs, total: ${total}`);

        const mapped = orgs.map(o => {
            const ownerMember = o.members[0]; // Assuming first owner
            const ownerName = ownerMember
                ? `${ownerMember.user.firstName || ''} ${ownerMember.user.otherNames || ''}`.trim()
                : 'Unknown';

            return {
                id: o.id,
                name: o.name,
                domain: o.domain || '',
                owner: ownerName || ownerMember?.user.email || 'Unknown',
                status: 'Active', // Mocked
                plan: 'Free',     // Mocked
                members: o._count.members,
                createdAt: o.createdAt.getTime()
            };
        });

        return { orgs: mapped, total };
    }

    async getOrg(id: string) {
        const o = await this.repo.getOrgById(id);
        if (!o) return null;

        const ownerMember = o.members.find(m => m.role === 'Owner') || o.members[0];

        return {
            id: o.id,
            name: o.name,
            domain: o.domain || '',
            owner: ownerMember?.user.firstName ? `${ownerMember.user.firstName} ${ownerMember.user.otherNames || ''}`.trim() : (ownerMember?.user.email || 'Unknown'),
            ownerEmail: ownerMember?.user.email || '',
            status: 'Active', // Mocked
            plan: 'Enterprise', // Mocked based on type? o.type is 'enterprise'
            members: o._count.members,
            createdAt: o.createdAt.getTime(),
            billingEmail: 'billing@' + (o.domain || 'example.com'), // Mocked for now
            taxId: 'Pending', // Mocked
            ssoEnabled: o.ssoEnabled,
            ssoDomains: o.ssoDomains,
            memberList: o.members.map(m => ({
                id: m.userId,
                name: m.user.firstName ? `${m.user.firstName} ${m.user.otherNames || ''}`.trim() : 'Unknown',
                email: m.user.email,
                role: m.role,
                status: m.user.emailVerified ? 'Active' : 'Pending',
                joinedAt: m.joinedAt.getTime(),
                avatarUrl: m.user.avatarUrl
            }))
        };
    }

    async getWallets(query: { skip?: number; take?: number; query?: string; status?: string }) {
        const { wallets, total } = await this.repo.getWallets(
            Number(query.skip) || 0,
            Number(query.take) || 20,
            query.query,
            query.status
        );

        const mapped = wallets.map(w => ({
            id: w.id,
            ownerName: w.user ? `${w.user.firstName || ''} ${w.user.otherNames || ''}`.trim() || 'Unknown' : 'System',
            ownerEmail: w.user?.email || 'N/A',
            balance: Number(w.balance),
            currency: w.currency,
            status: w.status === 'active' ? 'Active' : (w.status === 'frozen' ? 'Frozen' : 'Suspended'),
            lastTx: w.transactions[0]?.createdAt.getTime() || w.updatedAt.getTime(),
            riskScore: w.user?.kyc?.riskScore || 'Low'
        }));

        return { wallets: mapped, total };
    }

    async getWalletStats() {
        return this.repo.getDetailedWalletStats();
    }

    async updateWalletStatus(id: string, action: 'FREEZE' | 'UNFREEZE') {
        const nextStatus = action === 'FREEZE' ? 'frozen' : 'active';
        return this.repo.updateWalletStatus(id, nextStatus);
    }

    async getTransactions(query: { skip?: number; take?: number; query?: string; type?: string; status?: string }) {
        const { txs, total } = await this.repo.getTransactions(
            Number(query.skip) || 0,
            Number(query.take) || 20,
            query.query,
            query.type,
            query.status
        );

        const mapped = txs.map(t => {
            const ownerName = t.wallet.user
                ? `${t.wallet.user.firstName || ''} ${t.wallet.user.otherNames || ''}`.trim() || 'Unknown'
                : (t.wallet.organization?.name || 'System');

            return {
                id: t.id,
                user: {
                    name: ownerName,
                    email: t.wallet.user?.email || 'N/A'
                },
                type: t.type.charAt(0).toUpperCase() + t.type.slice(1) as any,
                amount: Number(t.amount),
                currency: t.currency as any,
                status: t.status === 'completed' ? 'Success' : (t.status === 'failed' ? 'Failed' : 'Pending'),
                date: t.createdAt.getTime(),
                description: t.description || ''
            };
        });

        return { txs: mapped, total };
    }

    async getApps(query: { skip?: number; take?: number; query?: string }) {
        const { apps, total } = await this.repo.getOAuthClients(
            Number(query.skip) || 0,
            Number(query.take) || 20,
            query.query
        );
        return { apps, total };
    }

    async getApp(id: string) {
        const app = await this.repo.getOAuthClientById(id);
        if (!app) throw new NotFoundException('App not found');
        return app;
    }

    async createApp(dto: AdminCreateOAuthClientDto) {
        const clientId = dto.clientId || `evz_${crypto.randomBytes(6).toString('hex')}`;
        let clientSecret: string | null = null;
        let clientSecretHash: string | null = null;

        if (dto.type === 'confidential') {
            clientSecret = `sk_${crypto.randomBytes(16).toString('hex')}`;
            clientSecretHash = await argon2.hash(clientSecret);
        }

        const app = await this.repo.createOAuthClient({
            clientId,
            name: dto.name,
            website: dto.website,
            clientSecretHash,
            redirectUris: dto.redirectUris,
            isFirstParty: dto.isFirstParty || false,
            isPublic: dto.type === 'public'
        });

        return {
            ...app,
            clientSecret // Only returned once
        };
    }

    async updateApp(id: string, dto: AdminUpdateOAuthClientDto) {
        const app = await this.repo.getOAuthClientById(id);
        if (!app) throw new NotFoundException('App not found');

        return this.repo.updateOAuthClient(id, {
            name: dto.name,
            website: dto.website,
            redirectUris: dto.redirectUris,
            isFirstParty: dto.isFirstParty
        });
    }

    async rotateAppSecret(id: string) {
        const app = await this.repo.getOAuthClientById(id);
        if (!app) throw new NotFoundException('App not found');
        if (app.isPublic) throw new Error('Public apps do not have secrets');

        const clientSecret = `sk_${crypto.randomBytes(16).toString('hex')}`;
        const clientSecretHash = await argon2.hash(clientSecret);

        await this.repo.updateOAuthClient(id, { clientSecretHash });

        return { clientSecret };
    }

    async deleteApp(id: string) {
        const app = await this.repo.getOAuthClientById(id);
        if (!app) throw new NotFoundException('App not found');
        return this.repo.deleteOAuthClient(id);
    }
}
