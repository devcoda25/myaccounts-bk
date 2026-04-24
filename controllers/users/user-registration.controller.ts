import { BadRequestException, Body, Controller, forwardRef, Inject, Post, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';
import { MinorApprovalService } from '../../services/auth/minor-approval.service';
import { VerificationService } from '../../services/auth/verification.service';
import { LocationService } from '../../services/users/location.service';
import { UserManagementService } from '../../services/users/user-management.service';
import { MetricsService } from '../../src/metrics/metrics.service';

@Controller('users')
export class UserRegistrationController {
    constructor(
        private userManagementService: UserManagementService,
        @Inject(forwardRef(() => VerificationService))
        private verificationService: VerificationService,
        private locationService: LocationService,
        private minorApprovalService: MinorApprovalService,
        private metrics: MetricsService,
    ) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto, @Req() req: FastifyRequest) {
        // Required for EVzone age-gating / minor handling.
        if (!createUserDto.dob) {
            throw new BadRequestException('Date of birth is required');
        }

        const user = await this.userManagementService.create(createUserDto);

        // Business metric: registration (minor vs adult)
        const isMinor = (user as any).accountStatus === 'MINOR_PENDING_PARENT';
        this.metrics.recordUserRegistration(isMinor);

        // Track Registration Location
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const location = this.locationService.getLocation(ip);

        if (location) {
            await this.userManagementService.updateProfile(user.id, { lastLocation: location } as any);
        }

        // Trigger verification (only if we actually have an email)
        if (user.email) {
            await this.verificationService.requestVerification(user.email, 'EMAIL_VERIFY');
        }

        // Under-18: send parent approval email (hard-block OIDC until approved)
        if ((user as any).accountStatus === 'MINOR_PENDING_PARENT' && (user as any).guardianEmail) {
            await this.minorApprovalService.createAndSendApproval(user.id, (user as any).guardianEmail);
        }

        // Never return sensitive fields
        const { passwordHash, twoFactorSecret, recoveryCodes, ...safeUser } = user as any;

        return {
            user: safeUser,
            minor: {
                status: safeUser.accountStatus || null,
                guardianEmail: safeUser.guardianEmail || null,
            },
        };
    }
}