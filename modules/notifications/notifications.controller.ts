
import { Controller, Get, Patch, Delete, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
// Assuming AuthGuard is available globally or imported from shared module. 
// However, standard practice in this repo seems to rely on global guards or specific ones.
// I'll assume standardAuthenticatedUser is available via @Request() user.
import { AuthenticatedUser } from '../../common/interfaces/auth-request.interface';

// We need to check how Auth is handled. Assuming request.user is populated by OIDC/Auth guard.

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@Request() req: { user: AuthenticatedUser }) {
        if (!req.user || !req.user.sub) {
            // Fallback for safety or development if auth is bypassed?
            // But app uses OIDC. 'sub' is usually the userId.
            throw new NotFoundException('User not identified');
        }
        return this.notificationsService.findAll(req.user.sub);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req: { user: AuthenticatedUser }) {
        return this.notificationsService.markAllAsRead(req.user.sub);
    }

    @Patch(':id/read')
    async markAsRead(@Request() req: { user: AuthenticatedUser }, @Param('id') id: string) {
        const result = await this.notificationsService.markAsRead(req.user.sub, id);
        if (!result) throw new NotFoundException('Notification not found');
        return result;
    }

    @Delete(':id')
    async remove(@Request() req: { user: AuthenticatedUser }, @Param('id') id: string) {
        const result = await this.notificationsService.remove(req.user.sub, id);
        if (!result) throw new NotFoundException('Notification not found');
        return { success: true };
    }
}
