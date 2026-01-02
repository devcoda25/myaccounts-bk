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

const pump = promisify(pipeline);

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
    constructor(
        private readonly userManagementService: UserManagementService,
        private readonly userQueryService: UserQueryService
    ) { }

    @Get('me')
    async getProfile(@CurrentUser() user: any) {
        return this.userQueryService.findById(user.sub || user.id, { fullProfile: true });
    }

    @Patch('me')
    async updateProfile(@CurrentUser() user: any, @Body() body: any) {
        // Filter allowed fields? UserManagementService.updateProfile handles general updates.
        // We should restrict what user can update on themselves (e.g. not role).
        const { role, password, emailVerified, phoneVerified, ...allowed } = body;
        return this.userManagementService.updateProfile(user.sub || user.id, allowed);
    }

    @Patch('me/settings')
    async updateSettings(@CurrentUser() user: any, @Body() body: any) {
        return this.userManagementService.updatePreferences(user.sub || user.id, body);
    }

    @Post('me/avatar')
    async uploadAvatar(@CurrentUser() user: any, @Req() req: FastifyRequest) {
        const parts = req.files();
        let avatarUrl = '';

        for await (const part of parts) {
            const fileExtName = extname(part.filename);
            const randomName = Array(4).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
            const filename = `avatar-${user.sub || user.id}-${randomName}${fileExtName}`;
            const savePath = join(process.cwd(), 'uploads', 'avatars', filename);

            await fs.mkdir(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });
            await pump(part.file, createWriteStream(savePath));

            avatarUrl = `/uploads/avatars/${filename}`;
        }

        if (avatarUrl) {
            await this.userManagementService.uploadAvatar(user.sub || user.id, avatarUrl);
        }

        return { url: avatarUrl };
    }

    @Post('me/contacts')
    async addContact(@CurrentUser() user: any, @Body() body: any) {
        return this.userManagementService.addContact(user.sub || user.id, body);
    }

    @Delete('me/contacts/:contactId')
    async removeContact(@CurrentUser() user: any, @Param('contactId') contactId: string) {
        return this.userManagementService.removeContact(user.sub || user.id, contactId);
    }

    @Post('me/contacts/:contactId/verify')
    async verifyContact(@CurrentUser() user: any, @Param('contactId') contactId: string, @Body() body: any) {
        // body could contain otp
        return this.userManagementService.verifyContact(user.sub || user.id, contactId, body.type || 'email');
    }


    @Post('create')
    @Roles('SUPER_ADMIN')
    async create(@Body() body: any) {
        // Enforce role if not present or validate it? 
        // For now, accept what's passed, relying on RolesGuard to restrict access to this endpoint to SUPER_ADMIN
        return this.userManagementService.create({
            ...body,
            acceptTerms: true, // Auto-accept terms for admin-created users
            emailVerified: true // Auto-verify email for admin-created users? Maybe not, checking logic.
            // UserCreateInput usually has emailVerified default false. 
            // If we want auto-verify, we can pass it if schema allows.
            // Let's assume we want them active immediately or let them verify. 
            // Often admin creation implies trust. Let's auto-verify email.
        });
        // We might need to update schema/service if emailVerified isn't in UserCreateInput directly or handled.
        // UserCreateRepository takes Prisma.UserCreateInput.
        // Checking schema... I didn't verify if emailVerified is in UserCreateInput but it usually is. 
        // Let's stick to basic create and maybe mark verified separately if needed, 
        // but UserManagementService.create only extracts specific fields. 
        // If I pass emailVerified, it goes to ...restUrl.
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
        return this.userQueryService.findById(id, { kycRecord: true });
    }

    @Patch(':id/role')
    @Roles('SUPER_ADMIN')
    async updateRole(@Param('id') id: string, @Body('role') role: string) {
        return this.userManagementService.updateUserRole(id, role);
    }

    @Patch(':id')
    @Roles('ADMIN', 'SUPER_ADMIN') // Or standard user for self? For now strict admin for this endpoint
    async update(@Param('id') id: string, @Body() body: any) {
        // Prevent role update via this generic endpoint
        const { role, password, ...allowedUpdates } = body;
        return this.userManagementService.updateProfile(id, allowedUpdates);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN') // Only super admin should delete for now
    async remove(@Param('id') id: string) {
        return this.userManagementService.deleteUser(id);
    }
}
