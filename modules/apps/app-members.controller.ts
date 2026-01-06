import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AppMembersService } from './app-members.service';
import { AuthGuard } from '../../common/guards/auth.guard'; // Assuming generic auth guard exists
import { AppRole } from '@prisma/client';

@Controller('apps/:clientId/members')
@UseGuards(AuthGuard)
export class AppMembersController {
    constructor(private readonly membersService: AppMembersService) { }

    @Get()
    async list(@Param('clientId') clientId: string, @Request() req: any) {
        return this.membersService.listMembers(clientId, req.user.id);
    }

    @Post()
    async invite(
        @Param('clientId') clientId: string,
        @Request() req: any,
        @Body() body: { email: string; role: AppRole; region?: string }
    ) {
        return this.membersService.inviteMember(clientId, req.user.id, body.email, body.role, body.region);
    }

    @Delete(':memberId')
    async remove(
        @Param('clientId') clientId: string,
        @Request() req: any,
        @Param('memberId') memberId: string
    ) {
        return this.membersService.removeMember(clientId, req.user.id, memberId);
    }
}
