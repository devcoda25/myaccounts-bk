import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HouseholdRepository {
    constructor(private prisma: PrismaService) { }

    async findOrCreateForUser(ownerId: string) {
        let household = await this.prisma.household.findUnique({
            where: { ownerId },
            include: { members: true },
        });

        if (!household) {
            household = await this.prisma.household.create({
                data: {
                    ownerId,
                    name: 'Primary Household',
                    approvalMode: 'Any guardian',
                },
                include: { members: true },
            });
        }

        return household;
    }

    async updateMode(ownerId: string, approvalMode: string) {
        return this.prisma.household.update({
            where: { ownerId },
            data: { approvalMode },
        });
    }

    async addMember(householdId: string, data: Omit<Prisma.HouseholdMemberUncheckedCreateInput, 'householdId'>) {
        return this.prisma.householdMember.create({
            data: { ...data, householdId },
        });
    }

    async removeMember(id: string) {
        return this.prisma.householdMember.delete({
            where: { id },
        });
    }

    async findMemberById(id: string) {
        return this.prisma.householdMember.findUnique({
            where: { id },
        });
    }
}
