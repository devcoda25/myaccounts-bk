import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';

@Injectable()
export class SecurityService {
    constructor(private prisma: PrismaService) { }

    async getOverview(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                contacts: true, // properties: type, verified
                sessions: {
                    where: {
                        expiresAt: { gt: new Date() }
                    }
                },
                _count: {
                    select: {
                        sessions: true
                    }
                }
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Calculate password age
        const passwordAgeDays = Math.floor((Date.now() - user.updatedAt.getTime()) / (1000 * 60 * 60 * 24));

        const verifiedEmails = (user.emailVerified ? 1 : 0) + (user.contacts?.filter(c => c.type === 'EMAIL' && c.verified).length || 0);
        const verifiedPhones = (user.phoneVerified ? 1 : 0) + (user.contacts?.filter(c => c.type === 'PHONE' && c.verified).length || 0);

        return {
            password: {
                lastChangedDays: passwordAgeDays,
                strength: 4, // Todo: calculate or store
                compromised: false,
            },
            mfa: {
                enabled: user.twoFactorEnabled,
                methods: user.twoFactorEnabled ? ['Authenticator'] : [], // Todo: support multiple
                recoveryCodesRemaining: 0, // Todo: store and count
            },
            passkeys: {
                enabled: false,
                count: 0
            },
            recovery: {
                verifiedEmails,
                verifiedPhones
            },
            sessions: {
                active: user._count.sessions
            }
        };
    }

    async getActivity(userId: string) {
        // Fetch audit logs
        const logs = await this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // Map to frontend expected format if needed, or return raw structure 
        // Frontend expects: { id, action, details, ipAddress, severity, createdAt }
        return logs.map(log => ({
            id: log.id,
            action: log.action,
            details: log.details,
            ip: log.ipAddress,
            severity: log.severity,
            createdAt: log.createdAt
        }));
    }
}
