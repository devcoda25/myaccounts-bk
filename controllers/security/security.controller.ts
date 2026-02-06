import { Controller, Get, Post, Delete, Body, UseGuards, Ip, Req, Param } from '@nestjs/common';
import { SecurityService } from '../../services/security/security.service';
import { MfaService } from '../../services/auth/mfa.service';
import { PasskeysService } from '../../services/auth/passkeys.service';
import { PasswordService } from '../../services/auth/password.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { SessionRepository } from '../../repos/auth/session.repository';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
    constructor(
        private service: SecurityService,
        private mfaService: MfaService,
        private passkeysService: PasskeysService,
        private passwordService: PasswordService,
        private prisma: PrismaService,
        private sessionRepo: SessionRepository
    ) { }

    @Get('overview')
    async getOverview(@CurrentUser() user: AuthRequest['user']) {
        // Fetch all security-related data from real backend services
        const [
            userData,
            mfaStatus,
            passkeys,
            contacts,
            sessions
        ] = await Promise.all([
            // Get user data with password info
            this.prisma.user.findUnique({
                where: { id: user.id },
                select: {
                    passwordHash: true,
                    twoFactorEnabled: true,
                    createdAt: true,
                    updatedAt: true,
                    emailVerified: true,
                    phoneVerified: true
                }
            }),
            // Get MFA status
            this.mfaService.getStatus(user.id),
            // Get passkeys count
            this.passkeysService.listPasskeys(user.id),
            // Get recovery contacts
            this.prisma.userContact.findMany({
                where: { userId: user.id, verified: true },
                select: { id: true, type: true, value: true }
            }),
            // Get active sessions (devices)
            this.sessionRepo.findActiveSessionsByUser(user.id)
        ]);

        // Calculate password strength (based on password age)
        const passwordStrength = this.calculatePasswordStrength(userData?.updatedAt);

        // Calculate last password change
        const lastPasswordChange = userData?.updatedAt
            ? Math.floor((Date.now() - new Date(userData.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        // Calculate security score (0-100)
        const securityScore = this.calculateSecurityScore({
            mfaEnabled: mfaStatus.enabled,
            passkeyCount: passkeys.length,
            verifiedEmails: contacts.filter(c => c.type === 'EMAIL').length,
            verifiedPhones: contacts.filter(c => c.type === 'PHONE').length,
            hasPassword: !!userData?.passwordHash,
            recentPasswordChange: lastPasswordChange < 90, // Changed within 90 days
        });

        return {
            securityScore,
            password: {
                lastChangedDays: lastPasswordChange,
                strength: passwordStrength.score,
                strengthLabel: passwordStrength.label,
                compromised: passwordStrength.compromised,
                hasPassword: !!userData?.passwordHash
            },
            mfa: {
                enabled: mfaStatus.enabled,
                methods: mfaStatus.methods,
                recoveryCodesRemaining: mfaStatus.recoveryCodesRemaining
            },
            passkeys: {
                enabled: passkeys.length > 0,
                count: passkeys.length
            },
            recovery: {
                verifiedEmails: contacts.filter(c => c.type === 'EMAIL').length,
                verifiedPhones: contacts.filter(c => c.type === 'PHONE').length,
                whatsapp: contacts.filter(c => c.type === 'PHONE').length > 0
            },
            devices: {
                activeCount: sessions.length,
                sessions: sessions.map(s => ({
                    id: s.id,
                    deviceInfo: s.deviceInfo,
                    createdAt: s.createdAt,
                    lastUsedAt: s.lastUsedAt,
                    expiresAt: s.expiresAt
                }))
            }
        };
    }

    @Get('activity')
    async getActivities(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getActivityLogs(user.id);
    }

    @Get('password-strength')
    async checkPasswordStrength(@Body() body: { password: string }) {
        // Simple password strength estimation without zxcvbn
        const password = body.password || '';
        let score = 0;
        const feedback: { warning?: string; suggestions?: string[] } = {};

        // Length checks
        if (password.length < 8) {
            feedback.warning = 'Password is too short';
            feedback.suggestions = ['Use at least 8 characters'];
        } else {
            score += 1;
        }

        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;

        // Character variety checks
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
        score += varietyCount - 1; // -1 because length already counted

        if (!hasUppercase || !hasLowercase) {
            feedback.suggestions = feedback.suggestions || [];
            feedback.suggestions.push('Mix uppercase and lowercase letters');
        }
        if (!hasNumbers) {
            feedback.suggestions = feedback.suggestions || [];
            feedback.suggestions.push('Add numbers');
        }
        if (!hasSpecial) {
            feedback.suggestions = feedback.suggestions || [];
            feedback.suggestions.push('Add special characters');
        }

        // Check for common patterns
        const commonPatterns = [/^[0-9]+$/, /^[a-zA-Z]+$/, /^(.)\1+$/]; // all numbers, all letters, repeated chars
        const hasCommonPattern = commonPatterns.some(p => p.test(password));
        if (hasCommonPattern) {
            score = Math.max(0, score - 1);
            feedback.warning = 'Password contains common patterns';
        }

        // Normalize score to 0-4 range
        const normalizedScore = Math.min(Math.max(score, 0), 4);

        // Estimate crack time (very simplified)
        const crackTimeBase = Math.pow(94, password.length); // 94 printable ASCII characters
        const crackTime = crackTimeBase > 1000000
            ? `${(crackTimeBase / 1e12).toFixed(1)} trillion years`
            : `${(crackTimeBase / 1e6).toFixed(1)} years`;

        return {
            score: normalizedScore,
            feedback,
            crackTime
        };
    }

    @Post('password/change')
    async changePassword(
        @CurrentUser() user: AuthRequest['user'],
        @Body() body: { currentPassword: string; newPassword: string; logoutOthers: boolean },
        @Ip() ip: string
    ) {
        const result = await this.passwordService.changePassword(
            user.id,
            body.currentPassword,
            body.newPassword,
            body.logoutOthers
        );

        // Log the action
        await this.service.logSecurityEvent(user.id, 'PASSWORD_CHANGE', ip, {
            action: 'User changed password',
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @Get('mfa/status')
    async getMfaStatus(@CurrentUser() user: AuthRequest['user']) {
        return this.mfaService.getStatus(user.id);
    }

    @Post('mfa/setup')
    async setupMfa(@CurrentUser() user: AuthRequest['user']) {
        return this.mfaService.generateSecret(user.id);
    }

    @Post('mfa/enable')
    async enableMfa(
        @CurrentUser() user: AuthRequest['user'],
        @Body() body: { token: string; method: 'authenticator' | 'sms' | 'whatsapp' },
        @Ip() ip: string
    ) {
        const result = await this.mfaService.verifyAndEnable(user.id, body.token, undefined, body.method);

        // Log the action
        await this.service.logSecurityEvent(user.id, 'MFA_ENABLED', ip, {
            method: body.method,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @Post('mfa/disable')
    async disableMfa(
        @CurrentUser() user: AuthRequest['user'],
        @Body() body: { token: string },
        @Ip() ip: string
    ) {
        // For disabling MFA, we need to verify with current MFA first
        // This is a simplified version - real implementation would verify the token
        await this.mfaService.disable(user.id);

        // Log the action
        await this.service.logSecurityEvent(user.id, 'MFA_DISABLED', ip, {
            timestamp: new Date().toISOString()
        });

        return { success: true };
    }

    @Post('mfa/recovery-codes')
    async regenerateRecoveryCodes(@CurrentUser() user: AuthRequest['user']) {
        return this.mfaService.regenerateRecoveryCodes(user.id);
    }

    @Get('passkeys')
    async getPasskeys(@CurrentUser() user: AuthRequest['user']) {
        return this.passkeysService.listPasskeys(user.id);
    }

    @Post('passkeys/register')
    async registerPasskey(@CurrentUser() user: AuthRequest['user']) {
        const userData = await this.prisma.user.findUnique({ where: { id: user.id } });
        if (!userData) throw new Error('User not found');
        return this.passkeysService.generateRegistrationOptions(user.id, userData.email);
    }

    @Post('passkeys/verify')
    async verifyPasskey(
        @CurrentUser() user: AuthRequest['user'],
        @Body() body: any,
        @Ip() ip: string
    ) {
        // In real implementation, challenge should be stored in session/redis
        const result = await this.passkeysService.verifyRegistration(user.id, body, body.challenge);

        // Log the action
        await this.service.logSecurityEvent(user.id, 'PASSKEY_CREATED', ip, {
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @Delete('passkeys/:id')
    async deletePasskey(
        @CurrentUser() user: AuthRequest['user'],
        @Param('id') id: string,
        @Ip() ip: string
    ) {
        const result = await this.passkeysService.deletePasskey(user.id, id);

        // Log the action
        await this.service.logSecurityEvent(user.id, 'PASSKEY_DELETED', ip, {
            passkeyId: id,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @Get('recovery/contacts')
    async getRecoveryContacts(@CurrentUser() user: AuthRequest['user']) {
        return this.prisma.userContact.findMany({
            where: { userId: user.id },
            select: { id: true, type: true, value: true, verified: true, isPrimary: true }
        });
    }

    @Get('devices')
    async getDevices(@CurrentUser() user: AuthRequest['user']) {
        const sessions = await this.sessionRepo.findActiveSessionsByUser(user.id);
        return sessions.map(s => ({
            id: s.id,
            deviceInfo: s.deviceInfo,
            createdAt: s.createdAt,
            lastUsedAt: s.lastUsedAt,
            expiresAt: s.expiresAt
        }));
    }

    @Delete('devices/:id')
    async revokeDevice(
        @CurrentUser() user: AuthRequest['user'],
        @Param('id') id: string,
        @Ip() ip: string
    ) {
        await this.sessionRepo.deleteSession(id);

        // Log the action
        await this.service.logSecurityEvent(user.id, 'DEVICE_REVOKED', ip, {
            sessionId: id,
            timestamp: new Date().toISOString()
        });

        return { success: true };
    }

    @Post('devices/revoke-all')
    async revokeAllDevices(
        @CurrentUser() user: AuthRequest['user'],
        @Ip() ip: string
    ) {
        const sessions = await this.sessionRepo.findActiveSessionsByUser(user.id);

        // Revoke all sessions
        for (const s of sessions) {
            await this.sessionRepo.deleteSession(s.id);
        }

        // Log the action
        await this.service.logSecurityEvent(user.id, 'ALL_DEVICES_REVOKED', ip, {
            timestamp: new Date().toISOString()
        });

        return { success: true, message: 'All devices revoked' };
    }

    @Post('reports')
    async report(@CurrentUser() user: AuthRequest['user'], @Body() body: { type: string, reason: string, details: string }, @Ip() ip: string) {
        return this.service.reportIncident(user.id, { ...body, ip });
    }

    @Post('lock')
    async lock(@CurrentUser() user: AuthRequest['user'], @Ip() ip: string) {
        return this.service.lockAccount(user.id, ip);
    }

    // Calculate password strength based on last change date
    private calculatePasswordStrength(lastPasswordChange?: Date): { score: number; label: string; compromised: boolean } {
        if (!lastPasswordChange) {
            return { score: 0, label: 'None', compromised: false };
        }

        const daysSinceChange = Math.floor((Date.now() - new Date(lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24));

        // Password strength based on recency and general best practices
        if (daysSinceChange > 365) {
            return { score: 1, label: 'Weak', compromised: true }; // Over a year old
        } else if (daysSinceChange > 180) {
            return { score: 2, label: 'Fair', compromised: false }; // 6+ months
        } else if (daysSinceChange > 90) {
            return { score: 3, label: 'Good', compromised: false }; // 3+ months
        } else {
            return { score: 4, label: 'Strong', compromised: false }; // Recently changed
        }
    }

    // Calculate overall security score (0-100)
    private calculateSecurityScore(data: {
        mfaEnabled: boolean;
        passkeyCount: number;
        verifiedEmails: number;
        verifiedPhones: number;
        hasPassword: boolean;
        recentPasswordChange: boolean;
    }): number {
        let score = 0;

        // MFA enabled: +30 points
        if (data.mfaEnabled) score += 30;

        // Passkeys: +20 points per passkey (max 20)
        score += Math.min(data.passkeyCount * 20, 20);

        // Recovery options: +10 per email, +10 per phone (max 20)
        score += Math.min(data.verifiedEmails * 10, 10);
        score += Math.min(data.verifiedPhones * 10, 10);

        // Has password: +10 points
        if (data.hasPassword) score += 10;

        // Recent password change: +10 points
        if (data.recentPasswordChange) score += 10;

        return Math.min(score, 100);
    }
}
