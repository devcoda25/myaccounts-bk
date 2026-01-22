import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UserWithProfile } from '../../common/interfaces/user.interface';

@Injectable()
export class UserFindRepository {
    constructor(private prisma: PrismaService) { }

    async findOneByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findOneByIdentifier(identifier: string): Promise<User | null> {
        if (!identifier) return null;
        if (identifier.includes('@')) {
            return this.prisma.user.findUnique({ where: { email: identifier } });
        }
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phoneNumber: identifier }
                ]
            }
        });
    }

    async findOneById(id: string, options: { includeContacts?: boolean; includeCredentials?: boolean; includeSessions?: boolean; includeAuditLogs?: boolean; includeOrgs?: boolean } = {}): Promise<UserWithProfile | null> {
        return (this.prisma as any).user.findUnique({
            where: { id },
            include: {
                contacts: options.includeContacts,
                credentials: options.includeCredentials,
                sessions: options.includeSessions ? { orderBy: { createdAt: 'desc' }, take: 20 } : false,
                auditLogs: options.includeAuditLogs ? { orderBy: { createdAt: 'desc' }, take: 50 } : false,
                orgMemberships: options.includeOrgs ? { include: { organization: true } } : false
            }
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        query?: string;
        role?: string;
        status?: string; // 'Active' or 'Disabled' mapped to emailVerified
    }): Promise<{ users: UserWithProfile[]; total: number }> {
        const { skip, take, query, role, status } = params;

        const where: Prisma.UserWhereInput = {};

        if (query) {
            where.OR = [
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { otherNames: { contains: query, mode: 'insensitive' } },
                { phoneNumber: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (role && role !== 'All') {
            where.role = role;
        }

        if (status && status !== 'All') {
            if (status === 'Active') where.emailVerified = true;
            if (status === 'Disabled') where.emailVerified = false;
            // 'Locked' is handled by frontend as disabled or specific flag, but backend only sees emailVerified for now
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { users, total };
    }
}
