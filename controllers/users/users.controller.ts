import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UserManagementService } from '../../services/users/user-management.service';
import { UserQueryService } from '../../services/users/user-query.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FastifyRequest } from 'fastify';
import { extname, join } from 'path';
import { createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateUserDto } from '../../common/dto/auth/create-user.dto';
import { UpdateUserDto } from '../../common/dto/auth/update-user.dto';

const pump = promisify(pipeline);

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(
        private readonly userManagementService: UserManagementService,
        private readonly userQueryService: UserQueryService
    ) { }

    @Get('me')
    async getProfile(@CurrentUser() user: AuthRequest['user']) {
        return this.userQueryService.findById(user.sub || (user as any).id, { fullProfile: true });
    }

    @Patch('me')
    async updateProfile(@CurrentUser() user: AuthRequest['user'], @Body() body: UpdateUserDto) {
        return this.userManagementService.updateProfile(user.sub || (user as any).id, body);
    }

    @Patch('me/settings')
    async updateSettings(@CurrentUser() user: AuthRequest['user'], @Body() body: Record<string, any>) {
        return this.userManagementService.updatePreferences(user.sub || (user as any).id, body);
    }

    @Post('me/avatar')
    async uploadAvatar(@CurrentUser() user: AuthRequest['user'], @Req() req: FastifyRequest) {
        const parts = req.files();
        let avatarUrl = '';

        for await (const part of parts) {
            const fileExtName = extname(part.filename);
            const randomName = Array(4).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
            const filename = `avatar-${user.sub || (user as any).id}-${randomName}${fileExtName}`;
            const savePath = join(process.cwd(), 'uploads', 'avatars', filename);

            await fs.mkdir(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });
            await pump(part.file, createWriteStream(savePath));

            avatarUrl = `/uploads/avatars/${filename}`;
        }

        if (avatarUrl) {
            await this.userManagementService.uploadAvatar(user.sub || (user as any).id, avatarUrl);
        }

        return { url: avatarUrl };
    }

    @Post('me/contacts')
    async addContact(@CurrentUser() user: AuthRequest['user'], @Body() body: { type: 'EMAIL' | 'PHONE' | 'WHATSAPP'; value: string; isPrimary?: boolean }) {
        return this.userManagementService.addContact(user.sub || (user as any).id, body);
    }

    @Delete('me/contacts/:contactId')
    async removeContact(@CurrentUser() user: AuthRequest['user'], @Param('contactId') contactId: string) {
        return this.userManagementService.removeContact(user.sub || (user as any).id, contactId);
    }

    @Delete('me/credentials/:provider')
    async removeCredential(@CurrentUser() user: AuthRequest['user'], @Param('provider') provider: 'google' | 'apple') {
        return this.userManagementService.removeCredential(user.sub || (user as any).id, provider);
    }

    @Post('me/contacts/:contactId/verify')
    async verifyContact(@CurrentUser() user: AuthRequest['user'], @Param('contactId') contactId: string, @Body() body: { type: 'email' | 'phone' }) {
        // body could contain otp
        return this.userManagementService.verifyContact(user.sub || (user as any).id, contactId, body.type || 'email');
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
    async findAll(
        @Query('skip') skip?: number,
        @Query('take') take?: number,
        @Query('query') query?: string,
        @Query('role') role?: string,
        @Query('status') status?: string
    ) {
        return this.userQueryService.findAll({
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            query,
            role,
            status
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
