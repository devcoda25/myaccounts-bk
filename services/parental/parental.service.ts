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
        // Generate random 6-char invite code
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const child = await this.childRepo.create({
            ...data,
            parentId,
            dob: new Date(data.dob),
            inviteCode
        });

        await this.activityRepo.create({
            childId: child.id,
            kind: 'Child Created',
            summary: `Created supervised account for ${child.name}`,
            severity: 'info',
        });

        return child;
    }

    async updateChild(id: string, data: any, audit?: { kind: string; summary: string; severity?: string }) {
        // Flatten the data if it comes from frontend nested structure
        const flattened = this.flattenChildPatch(data);

        const child = await this.childRepo.update(id, flattened);
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

    private flattenChildPatch(data: any): Prisma.ChildProfileUpdateInput {
        const flat: any = { ...data };

        // Flatten Charging
        if (data.charging) {
            flat.chargingEnabled = data.charging.enabled;
            flat.dailyKwhCap = data.charging.dailyKwhCap;
            flat.sessionKwhCap = data.charging.sessionKwhCap;
            flat.reqApprovalAboveKwh = data.charging.requireApprovalAboveKwh;
            flat.allowedStations = data.charging.allowedStations;
            delete flat.charging;
        }

        // Flatten Curfew
        if (data.curfew) {
            flat.curfewEnabled = data.curfew.enabled;
            flat.curfewStart = data.curfew.start;
            flat.curfewEnd = data.curfew.end;
            flat.curfewHardLock = data.curfew.hardLock;
            flat.curfewAllowSchool = data.curfew.allowSchoolOnlyDuringCurfew;
            delete flat.curfew;
        }

        // Flatten Geofences
        if (data.geofences) {
            flat.geofencesEnabled = data.geofences.enabled;
            flat.geofencesAlerts = data.geofences.alertsOnEnterLeave;
            if (data.geofences.home) {
                flat.homeAddress = data.geofences.home.address;
                flat.homeRadius = data.geofences.home.radiusKm;
            }
            if (data.geofences.school) {
                flat.schoolAddress = data.geofences.school.address;
                flat.schoolRadius = data.geofences.school.radiusKm;
            }
            delete flat.geofences;
        }

        // Flatten Daily Window
        if (data.dailyWindow) {
            flat.dailyWindowStart = data.dailyWindow.start;
            flat.dailyWindowEnd = data.dailyWindow.end;
            delete flat.dailyWindow;
        }

        return flat;
    }

    async linkChild(parentId: string, code: string) {
        // 1. Find child by invite code
        const child = await this.childRepo.findOneByInviteCode(code);
        if (!child) {
            throw new NotFoundException('Invalid invite code');
        }

        // 2. Add parent to household or update child's guardian list
        // For strict "transfer" logic (demo simplicity): we just update the parentId
        // In a real multi-guardian system, we'd add this parent to the child's guardian list.
        await this.childRepo.update(child.id, { parent: { connect: { id: parentId } } });

        // 3. Clear code to prevent reuse
        await this.childRepo.update(child.id, { inviteCode: null });

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

    async decideApproval(approvalId: string, approve: boolean, guardianId: string) {
        // Fetch approval to get childId
        const existing = await this.approvalRepo.findOneById(approvalId);
        if (!existing) throw new NotFoundException('Approval not found');

        // Fetch household mode via Child -> Parent -> Household
        // (Assuming parentId is the household owner for simplicity)
        const child = await this.childRepo.findOneById(existing.childId);
        const household = await this.householdRepo.findOrCreateForUser(child?.parentId || '');

        let newStatus = existing.status;
        const currentVotes = (existing.votes as string[]) || [];

        if (approve) {
            // "Both guardians" Mode
            if (household.approvalMode === 'Both guardians') {
                // Add vote if not already present
                if (!currentVotes.includes(guardianId)) {
                    await this.approvalRepo.addVote(approvalId, guardianId);
                    currentVotes.push(guardianId);
                }

                // Check consensus
                // If there's only 1 guardian in the household, allow single vote.
                // Otherwise require 2 distinct votes.
                const guardianCount = household.members.filter(m =>
                    (m.role === 'Guardian' || m.role === 'Co-guardian') && m.status === 'Active'
                ).length + 1; // +1 for Owner

                const requiredVotes = guardianCount > 1 ? 2 : 1;

                if (currentVotes.length >= requiredVotes) {
                    newStatus = 'Approved';
                } else {
                    // Stay Pending
                }
            } else {
                // "Any guardian" Mode -> Approved immediately
                newStatus = 'Approved';
                // Record vote anyway
                if (!currentVotes.includes(guardianId)) {
                    await this.approvalRepo.addVote(approvalId, guardianId);
                }
            }
        } else {
            newStatus = 'Declined';
        }

        // Only update status if it changed to final
        if (newStatus !== existing.status) {
            const approval = await this.approvalRepo.updateStatus(approvalId, newStatus);
            await this.activityRepo.create({
                childId: approval.childId,
                kind: approve ? 'Approval Update' : 'Approval Declined',
                summary: `${newStatus}: ${approval.title}`,
                severity: newStatus === 'Approved' ? 'info' : 'warning',
            });
            return approval;
        }

        return existing;
    }

    // --- Activity ---
    async getActivity(ownerId: string) {
        return this.activityRepo.findManyByOwner(ownerId);
    }
}
