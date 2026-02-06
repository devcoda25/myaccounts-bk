import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, BadRequestException, UnauthorizedException, Req } from '@nestjs/common';
import { UserManagementService } from '../../services/users/user-management.service';
import { UserQueryService } from '../../services/users/user-query.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FastifyRequest } from 'fastify';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';
import { UpdateUserDto } from '../../common/dto/auth/update-user.dto';
import { StorageService } from '../../modules/storage/storage.service';
import { randomBytes } from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

// Maximum search query length to prevent DoS
const MAX_QUERY_LENGTH = 200;
const MAX_SKIP = 10000;
const MAX_TAKE = 100;

// Promisify file type detection for async/await usage
const detectFileType = async (buffer: Buffer) => {
    try {
        const result = await fileTypeFromBuffer(buffer);
        return result || null;
    } catch (error) {
        return null;
    }
};

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(
        private readonly userManagementService: UserManagementService,
        private readonly userQueryService: UserQueryService,
        private readonly storageService: StorageService
    ) { }

    @Get('me')
    async getProfile(@CurrentUser() user: AuthRequest['user']) {
        const profile = await this.userQueryService.findById(user.id, { fullProfile: true });
        console.log(`[Users] /users/me for ${user.id}:`, {
            hasSessions: Array.isArray(profile?.sessions),
            sessionCount: profile?.sessions?.length || 0
        });
        return profile;
    }

    @Patch('me')
    async updateProfile(@CurrentUser() user: AuthRequest['user'], @Body() body: UpdateUserDto) {
        return this.userManagementService.updateProfile(user.id, body);
    }

    @Patch('me/settings')
    async updateSettings(@CurrentUser() user: AuthRequest['user'], @Body() body: Record<string, any>) {
        return this.userManagementService.updatePreferences(user.id, body);
    }

    @Post('me/avatar')
    async uploadAvatar(@CurrentUser() user: AuthRequest['user'], @Req() req: FastifyRequest) {
        // Use Fastify's file handling - parts() returns async iterator
        const parts = req.parts();
        let avatarUrl = '';

        for await (const part of parts) {
            if (part.type === 'file') {
                const fileBuffer = await part.toBuffer();

                // [Security] Magic Byte Validation
                const type = await detectFileType(fileBuffer);

                // Allowlist - only image types
                const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!type || !allowedMimes.includes(type.mime)) {
                    throw new UnauthorizedException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
                }

                const fileExtName = `.${type.ext}`;
                const randomName = randomBytes(8).toString('hex');
                const filename = `avatar-${user.id}-${randomName}${fileExtName}`;
                const key = `avatars/${user.id}/${filename}`;

                // Upload to S3/Spaces
                await this.storageService.upload(key, fileBuffer, type.mime, true);

                // Use Public CDN URL
                avatarUrl = this.storageService.getPublicUrl(key);
                break; // Only process first file
            }
        }

        if (!avatarUrl) {
            throw new UnauthorizedException('No file uploaded');
        }

        if (avatarUrl) {
            await this.userManagementService.uploadAvatar(user.id, avatarUrl);
        }

        return { url: avatarUrl };
    }

    @Post('me/contacts')
    async addContact(@CurrentUser() user: AuthRequest['user'], @Body() body: { type: 'EMAIL' | 'PHONE' | 'WHATSAPP'; value: string; isPrimary?: boolean }) {
        return this.userManagementService.addContact(user.id, body);
    }

    @Patch('me/contacts/:contactId')
    async updateContact(
        @CurrentUser() user: AuthRequest['user'],
        @Param('contactId') contactId: string,
        @Body() body: { label?: string; capabilities?: any }
    ) {
        return this.userManagementService.updateContact(user.id, contactId, body);
    }

    @Delete('me/contacts/:contactId')
    async removeContact(@CurrentUser() user: AuthRequest['user'], @Param('contactId') contactId: string) {
        return this.userManagementService.removeContact(user.id, contactId);
    }

    @Delete('me/credentials/:provider')
    async removeCredential(@CurrentUser() user: AuthRequest['user'], @Param('provider') provider: 'google' | 'apple') {
        return this.userManagementService.removeCredential(user.id, provider);
    }

    @Post('me/contacts/:contactId/verify')
    async verifyContact(@CurrentUser() user: AuthRequest['user'], @Param('contactId') contactId: string, @Body() body: { type: 'email' | 'phone' }) {
        // body could contain otp
        return this.userManagementService.verifyContact(user.id, contactId, body.type || 'email');
    }


    @Post('create')
    @Roles('SUPER_ADMIN')
    async create(@Body() body: CreateUserDto) {
        return this.userManagementService.create({
            ...body,
            acceptTerms: true,
            emailVerified: true // Auto-verify email for admin-created users
        } as any); // Cast because create expects DTO but we are adding fields, might need adjusted DTO or service method
    }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN')
    @UseGuards(ThrottlerGuard)
    async findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('query') query?: string,
        @Query('role') role?: string,
        @Query('status') status?: string
    ) {
        // [Security] Validate and sanitize input parameters
        const skipNum = skip ? parseInt(skip, 10) : 0;
        const takeNum = take ? parseInt(take, 10) : 20;

        if (isNaN(skipNum) || skipNum < 0 || skipNum > MAX_SKIP) {
            throw new BadRequestException(`Invalid skip parameter. Must be 0-${MAX_SKIP}`);
        }
        if (isNaN(takeNum) || takeNum < 1 || takeNum > MAX_TAKE) {
            throw new BadRequestException(`Invalid take parameter. Must be 1-${MAX_TAKE}`);
        }

        // [Security] Sanitize and validate search query
        const sanitizedQuery = query?.slice(0, MAX_QUERY_LENGTH).trim() || undefined;

        // Validate role filter
        const validRoles = ['SUPER_ADMIN', 'ADMIN', 'USER', 'All'];
        const sanitizedRole = (role && validRoles.includes(role)) ? role : undefined;

        // Validate status filter
        const validStatuses = ['Active', 'Disabled', 'Locked', 'All'];
        const sanitizedStatus = (status && validStatuses.includes(status)) ? status : undefined;

        return this.userQueryService.findAll({
            skip: skipNum,
            take: takeNum,
            query: sanitizedQuery,
            role: sanitizedRole,
            status: sanitizedStatus
        });
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async findOne(@Param('id') id: string) {
        return this.userQueryService.findById(id, { fullProfile: true });
    }

    @Patch(':id/role')
    @Roles('SUPER_ADMIN')
    async updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.userManagementService.updateUserRole(id, role);
    }

    @Patch(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
        return this.userManagementService.updateProfile(id, body);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN')
    async remove(@Param('id') id: string) {
        return this.userManagementService.deleteUser(id);
    }
}
