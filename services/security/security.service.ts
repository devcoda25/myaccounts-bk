import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class SecurityService {
    constructor(private prisma: PrismaService) { }

    async reportIncident(userId: string, data: { type: string, reason: string, details: string, ip?: string }) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action: data.type === 'suspicious_login' ? 'REPORT_SUSPICIOUS_LOGIN' : 'REPORT_COMPROMISE',
                severity: 'critical',
                ipAddress: data.ip,
                details: {
                    reason: data.reason,
                    description: data.details,
                    reportedAt: new Date().toISOString()
                },
                actorName: 'User'
            }
        });
    }

    async lockAccount(userId: string, ip?: string) {
        // 1. Log the action
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'ACCOUNT_LOCK_USER_INITIATED',
                severity: 'critical',
                ipAddress: ip,
                details: {
                    reason: 'User initiated emergency lock',
                },
                actorName: 'User'
            }
        });

        // 2. Freeze Wallet
        await this.prisma.wallet.updateMany({
            where: { userId },
            data: { status: 'frozen' }
        });

        // 3. Revoke all sessions
        await this.prisma.session.deleteMany({
            where: { userId }
        });

        // 4. (Optional) Could update User model if it had a status field

        return { success: true, message: 'Account locked and sessions revoked.' };
    }
}
