import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from '../../repos/admin/admin.repository';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AdminCreateOAuthClientDto, AdminUpdateOAuthClientDto } from '../../common/dto/admin/admin-apps.dto';
import { AuditLogDetails } from '../../common/interfaces/audit-log.interface';

@Injectable()
export class AdminService {
    constructor(private repo: AdminRepository) { }

    async getSystemHealth() {
        try {
            await this.repo.ping();
            return {
                db: 'Operational',
                auth: 'Operational', // If we are here, Auth is up
                api: 'Operational'
            };
        } catch (e) {
            return {
                db: 'Degraded',
                auth: 'Operational',
                api: 'Operational'
            };
        }
    }

    async getDashboardStats() {
        const counts = await this.repo.getCounts();
        const balance = 0; // await this.repo.getTotalWalletBalance();

        return {
            usersCount: counts.users,
            orgsCount: 0, // counts.orgs - kept for API compat if needed, but logic removed
            sessionsCount: counts.sessions,
            balance: 0 // Number(balance)
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
            const riskMap: Record<string, 'High' | 'Medium' | 'Low'> = { 'critical': 'High', 'warning': 'Medium', 'info': 'Low' };
            const details = (l.details || {}) as AuditLogDetails;

            return {
                id: l.id,
                at: l.createdAt.getTime(),
                actor: l.actorName || l.user?.email || 'System',
                role: l.user?.role || 'N/A',
                action: l.action,
                target: details.target || 'N/A',
                ip: l.ipAddress || '0.0.0.0',
                outcome: details.outcome || 'Success',
                risk: riskMap[l.severity] || 'Low',
                requestId: details.requestId || 'N/A',
                meta: details
            };
        });

        return { logs: mapped, total };
    }

    // Org, Wallet, and Transaction methods removed

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
            isPublic: dto.type === 'public',
            description: dto.description,
            icon: dto.icon,
            color: dto.color
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
            isFirstParty: dto.isFirstParty,
            description: dto.description,
            icon: dto.icon,
            color: dto.color
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


    // --- User Management ---

    async revokeUserSessions(userId: string) {
        return this.repo.revokeUserSessions(userId);
    }

    async resetUserPassword(userId: string, password: string) {
        const hash = await argon2.hash(password);
        return this.repo.updateUserPassword(userId, hash);
    }

    async getAdmins() {
        const admins = await this.repo.getAdmins();
        return admins.map(a => ({
            id: a.id,
            name: `${a.firstName || ''} ${a.otherNames || ''}`.trim() || 'Unknown',
            email: a.email,
            role: a.role,
            lastActive: a.updatedAt.toISOString(), // Simplified
            status: a.emailVerified ? 'Active' : 'Invited'
        }));
    }

    async inviteAdmin(email: string, role: string) {
        // For now, we only promote existing users.
        const user = await this.repo.getAdminByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found. Please ask them to sign up first.');
        }
        return this.repo.updateUserRole(user.id, role);
    }

    async removeAdmin(id: string) {
        // Downgrade to USER
        return this.repo.updateUserRole(id, 'USER');
    }

    // --- App Memberships ---

    async getAppMembers(clientId: string) {
        const memberships = await this.repo.getAppMemberships(clientId);
        return memberships.map(m => ({
            id: m.id,
            userId: m.userId,
            name: `${m.user.firstName || ''} ${m.user.otherNames || ''}`.trim() || 'Unknown',
            email: m.user.email,
            role: m.role,
            createdAt: m.createdAt.toISOString()
        }));
    }

    async inviteAppAdmin(clientId: string, email: string, role: string) {
        const user = await this.repo.getAdminByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found. Please ask them to sign up first.');
        }

        // Check if already an admin for this app
        const existing = await this.repo.getAppMembershipByUserAndClient(user.id, clientId);
        if (existing) {
            throw new Error('User is already an admin for this application.');
        }

        return this.repo.createAppMembership({
            userId: user.id,
            clientId,
            role
        });
    }

    async removeAppAdmin(membershipId: string) {
        return this.repo.deleteAppMembership(membershipId);
    }
}
