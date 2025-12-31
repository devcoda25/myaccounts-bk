import { Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MediaService } from '../../services/media/media.service';
import { UserManagementService } from '../../services/users/user-management.service';

@Controller('users')
export class AvatarController {
    constructor(
        private mediaService: MediaService,
        private userManagementService: UserManagementService
    ) { }

    @Post('me/avatar')
    @UseGuards(AuthGuard)
    async uploadAvatar(@Req() req: FastifyRequest, @CurrentUser() user: any) {
        const data = await req.file();
        if (!data) {
            throw new BadRequestException('File is required');
        }

        const buffer = await data.toBuffer();
        const url = await this.mediaService.saveFile(buffer, data.filename);

        await this.userManagementService.updateProfile(user.sub || user.id, { avatarUrl: url });

        return { url };
    }
}
