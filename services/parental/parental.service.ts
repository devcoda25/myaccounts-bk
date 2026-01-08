import { Injectable, NotFoundException } from '@nestjs/common';
import { ChildProfileRepository } from '../../repos/parental/child-profile.repository';
import { HouseholdRepository } from '../../repos/parental/household.repository';
import { ParentalApprovalRepository } from '../../repos/parental/parental-approval.repository';
import { ParentalActivityRepository } from '../../repos/parental/parental-activity.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParentalService {
    constructor(
        private childRepo: ChildProfileRepository,
        private householdRepo: HouseholdRepository,
        private approvalRepo: ParentalApprovalRepository,
        private activityRepo: ParentalActivityRepository,
    ) { }

    // --- Children ---
    async getChildren(parentId: string) {
        return this.childRepo.findManyByParentId(parentId);
    }

    async createChild(parentId: string, data: Omit<Prisma.ChildProfileUncheckedCreateInput, 'parentId' | 'dob'> & { dob: string | Date }) {
        const child = await this.childRepo.create({
            ...data,
            parentId,
            dob: new Date(data.dob),
        });

        await this.activityRepo.create({
            childId: child.id,
            kind: 'Child Created',
            summary: `Created supervised account for ${child.name}`,
            severity: 'info',
        });

        return child;
    }

    async updateChild(id: string, data: Prisma.ChildProfileUpdateInput, audit?: { kind: string; summary: string; severity?: string }) {
        const child = await this.childRepo.update(id, data);
        if (audit) {
            await this.activityRepo.create({
                childId: id,
                kind: audit.kind,
                summary: audit.summary,
                severity: audit.severity || 'info',
            });
        }
        return child;
    }

    async linkChild(parentId: string, code: string) {
        // In a real system, we'd look up the child by the invite code.
        // For demo/parity, we'll create a "linked" child.
        const child = await this.childRepo.create({
            parentId,
            name: 'Linked Child',
            dob: new Date('2013-06-01'),
            status: 'Active',
            country: 'Uganda',
            template: 'Child (6-12)',
        });

        await this.activityRepo.create({
            childId: child.id,
            kind: 'Child Linked',
            summary: `Linked child account via code ${code}`,
            severity: 'info',
        });

        return child;
    }

    // --- Household ---
    async getHousehold(ownerId: string) {
        return this.householdRepo.findOrCreateForUser(ownerId);
    }

    async updateHouseholdMode(ownerId: string, mode: string) {
        return this.householdRepo.updateMode(ownerId, mode);
    }

    async inviteMember(ownerId: string, data: Omit<Prisma.HouseholdMemberUncheckedCreateInput, 'householdId'>) {
        const household = await this.householdRepo.findOrCreateForUser(ownerId);
        return this.householdRepo.addMember(household.id, data);
    }

    async removeMember(memberId: string) {
        return this.householdRepo.removeMember(memberId);
    }

    // --- Approvals ---
    async getApprovals(ownerId: string) {
        return this.approvalRepo.findPendingByOwner(ownerId);
    }

    async decideApproval(approvalId: string, approve: boolean) {
        const status = approve ? 'Approved' : 'Declined';
        const approval = await this.approvalRepo.updateStatus(approvalId, status);

        await this.activityRepo.create({
            childId: approval.childId,
            kind: approve ? 'Approval Approved' : 'Approval Declined',
            summary: `${approve ? 'Approved' : 'Declined'}: ${approval.title}`,
            severity: approve ? 'info' : 'warning',
        });

        return approval;
    }

    // --- Activity ---
    async getActivity(ownerId: string) {
        return this.activityRepo.findManyByOwner(ownerId);
    }
}
