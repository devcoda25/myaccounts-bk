import { Controller, Get, Delete, Param, UseGuards, Request, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { SessionRepository } from '../../repos/auth/session.repository';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('auth')
@UseGuards(AuthGuard)
export class SessionsController {
    constructor(private sessionRepo: SessionRepository) { }

    @Get('sessions')
    async listSessions(@Req() req: AuthRequest) {
        const sessions = await this.sessionRepo.findActiveSessionsByUser(req.user.sub);
        return sessions.map(s => ({
            id: s.id,
            deviceInfo: s.deviceInfo,
            lastUsedAt: s.lastUsedAt,
            isCurrent: s.id === req.user.jti
        }));
    }

    @Delete('sessions/:id')
    async revokeSession(@Req() req: AuthRequest, @Param('id') id: string) {
        // Users can only revoke their own sessions
        const session = await this.sessionRepo.findSessionById(id);
        if (!session || session.userId !== req.user.sub) {
            // silent fail or 404
            return { status: 'ok' };
        }
        await this.sessionRepo.deleteSession(id);
        return { status: 'revoked' };
    }

    @Delete('sessions')
    async revokeAllOthers(@Req() req: AuthRequest) {
        const sessions = await this.sessionRepo.findActiveSessionsByUser(req.user.sub);
        const currentId = req.user.jti;

        for (const s of sessions) {
            if (s.id !== currentId) {
                await this.sessionRepo.deleteSession(s.id);
            }
        }
        return { status: 'others_revoked' };
    }
}
