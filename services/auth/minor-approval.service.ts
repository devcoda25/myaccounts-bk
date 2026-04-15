import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MinorApprovalStatus, UserAccountStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class MinorApprovalService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    private hashToken(token: string) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    private getFrontendBaseUrl() {
        return (process.env.FRONTEND_URL || 'https://accounts.evzone.app').replace(/\/$/, '');
    }

    async createAndSendApproval(childId: string, guardianEmail: string) {
        const email = (guardianEmail || '').trim().toLowerCase();
        if (!email) throw new BadRequestException('Parent/guardian email is required');

        // Invalidate any previous pending requests for this child.
        await this.prisma.minorApprovalRequest.updateMany({
            where: { childId, status: MinorApprovalStatus.PENDING },
            data: { status: MinorApprovalStatus.CANCELLED },
        });

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

        await this.prisma.minorApprovalRequest.create({
            data: {
                childId,
                guardianEmail: email,
                tokenHash,
                expiresAt,
                status: MinorApprovalStatus.PENDING,
            }
        });

        const approveLink = `${this.getFrontendBaseUrl()}/auth/parent-approve?child=${encodeURIComponent(childId)}&token=${encodeURIComponent(token)}`;

        const subject = 'Approve EVzone Minor Account';
        const text = `A child account has requested access to EVzone. Approve here: ${approveLink}`;
        const html = `
            <h3>Approve Minor Account</h3>
            <p>A child account has requested access to EVzone services.</p>
            <p><a href="${approveLink}" style="background:#f77f00;color:white;padding:10px 18px;text-decoration:none;border-radius:8px;font-weight:800">Approve Account</a></p>
            <p>This link expires in 7 days.</p>
        `;

        await this.emailService.sendEmail(email, subject, text, html);

        return { success: true };
    }

    async approve(childId: string, token: string, guardianUser: { id: string; email: string }) {
        const tokenHash = this.hashToken((token || '').trim());
        if (!childId || !tokenHash) throw new BadRequestException('Invalid approval link');

        const req = await this.prisma.minorApprovalRequest.findFirst({
            where: {
                childId,
                tokenHash,
                status: MinorApprovalStatus.PENDING,
            }
        });

        if (!req) {
            throw new NotFoundException('Approval request not found or already used');
        }

        if (req.expiresAt < new Date()) {
            await this.prisma.minorApprovalRequest.update({
                where: { id: req.id },
                data: { status: MinorApprovalStatus.EXPIRED },
            });
            throw new BadRequestException('Approval link expired');
        }

        const guardianEmail = guardianUser.email.trim().toLowerCase();
        if (guardianEmail !== req.guardianEmail.trim().toLowerCase()) {
            throw new ForbiddenException('This approval link is not assigned to your account');
        }

        await this.prisma.$transaction([
            this.prisma.minorApprovalRequest.update({
                where: { id: req.id },
                data: {
                    status: MinorApprovalStatus.APPROVED,
                    approvedAt: new Date(),
                    guardianUserId: guardianUser.id,
                }
            }),
            this.prisma.user.update({
                where: { id: childId },
                data: {
                    accountStatus: UserAccountStatus.MINOR_ACTIVE,
                    guardianUserId: guardianUser.id,
                    guardianEmail: req.guardianEmail,
                }
            })
        ]);

        return { success: true };
    }

    async resendForChild(childId: string) {
        const child = await this.prisma.user.findUnique({ where: { id: childId } });
        if (!child) throw new NotFoundException('User not found');

        if (child.accountStatus !== UserAccountStatus.MINOR_PENDING_PARENT) {
            throw new BadRequestException('Account is not pending parent approval');
        }

        if (!child.guardianEmail) {
            throw new BadRequestException('No parent/guardian email found for this account');
        }

        return this.createAndSendApproval(childId, child.guardianEmail);
    }
}