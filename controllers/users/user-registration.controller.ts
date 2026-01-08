import { Controller, Post, Body, Inject, forwardRef, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { UserManagementService } from '../../services/users/user-management.service';
import { VerificationService } from '../../services/auth/verification.service';
import { LocationService } from '../../services/users/location.service';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';

@Controller('users')
export class UserRegistrationController {
    constructor(
        private userManagementService: UserManagementService,
        @Inject(forwardRef(() => VerificationService))
        private verificationService: VerificationService,
        private locationService: LocationService
    ) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto, @Req() req: FastifyRequest) {
        const user = await this.userManagementService.create(createUserDto);

        // Track Registration Location
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';
        const location = this.locationService.getLocation(ip);

        if (location) {
            await this.userManagementService.updateProfile(user.id, { lastLocation: location } as any);
        }

        // Trigger verification (using VerificationService directly)
        const verification = await this.verificationService.requestVerification(user.email, 'EMAIL_VERIFY');
        return { ...user };
    }
}
