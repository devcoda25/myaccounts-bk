import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChildProfileRepository {
    constructor(private prisma: PrismaService) { }

    async findManyByParentId(parentId: string) {
        const children = await this.prisma.childProfile.findMany({
            where: { parentId },
            include: {
                approvals: true,
                activities: {
                    take: 10,
                    orderBy: { at: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return children.map(this.mapToDomain);
    }

    async findOneById(id: string) {
        const child = await this.prisma.childProfile.findUnique({
            where: { id },
            include: {
                approvals: true,
                activities: {
                    orderBy: { at: 'desc' },
                },
            },
        });
        return child ? this.mapToDomain(child) : null;
    }

    async findOneByInviteCode(inviteCode: string) {
        const child = await this.prisma.childProfile.findUnique({
            where: { inviteCode },
        });
        return child ? this.mapToDomain(child) : null;
    }

    async create(data: Prisma.ChildProfileUncheckedCreateInput) {
        const child = await this.prisma.childProfile.create({
            data: {
                ...data,
                apps: data.apps || {}, // Ensure apps is initialized
            }
        });
        return this.mapToDomain(child);
    }

    async update(id: string, data: Prisma.ChildProfileUpdateInput) {
        // Handle nested updates by flattening them if necessary
        // Ideally, the Service should handle this flattening, but for now we rely on the DTO being correct (or flat).
        // If the DTO passes nested objects, Prisma will complain. 
        // We assume for now the Service/Controller passes flat updates or compatible Prisma inputs.
        // But we MUST map the result back.

        const child = await this.prisma.childProfile.update({
            where: { id },
            data,
        });
        return this.mapToDomain(child);
    }

    async delete(id: string) {
        const child = await this.prisma.childProfile.delete({
            where: { id },
        });
        return this.mapToDomain(child);
    }

    private mapToDomain(child: any) {
        return {
            ...child,
            apps: child.apps || {},
            charging: {
                enabled: child.chargingEnabled,
                dailyKwhCap: child.dailyKwhCap || 0,
                sessionKwhCap: child.sessionKwhCap || 0,
                requireApprovalAboveKwh: child.reqApprovalAboveKwh || 0,
                allowedStations: child.allowedStations || [],
            },
            curfew: {
                enabled: child.curfewEnabled,
                start: child.curfewStart || "21:00",
                end: child.curfewEnd || "06:00",
                hardLock: child.curfewHardLock,
                allowSchoolOnlyDuringCurfew: child.curfewAllowSchool,
            },
            geofences: {
                enabled: child.geofencesEnabled,
                alertsOnEnterLeave: child.geofencesAlerts,
                home: child.homeAddress ? {
                    label: "Home",
                    address: child.homeAddress,
                    radiusKm: child.homeRadius || 0.5
                } : null,
                school: child.schoolAddress ? {
                    label: "School",
                    address: child.schoolAddress,
                    radiusKm: child.schoolRadius || 0.5
                } : null,
            },
            dailyWindow: {
                start: child.dailyWindowStart || "06:00",
                end: child.dailyWindowEnd || "21:00",
            }
        };
    }
}
