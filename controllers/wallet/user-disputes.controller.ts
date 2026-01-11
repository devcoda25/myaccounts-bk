import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UserDisputesService } from '../../services/wallet/user-disputes.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CreateDisputeDto, AddEvidenceDto } from '../../common/dto/wallet/dispute.dto';

@Controller('wallets/disputes')
@UseGuards(AuthGuard)
export class UserDisputesController {
    constructor(private service: UserDisputesService) { }

    @Post()
    async createDispute(@CurrentUser() user: AuthRequest['user'], @Body() body: CreateDisputeDto) {
        return this.service.createDispute(user.id, body);
    }

    @Get()
    async getMyDisputes(@CurrentUser() user: AuthRequest['user']) {
        return this.service.getMyDisputes(user.id);
    }

    @Post(':id/evidence')
    async addEvidence(@CurrentUser() user: AuthRequest['user'], @Param('id') id: string, @Body() body: AddEvidenceDto) {
        return this.service.addEvidence(user.id, id, {
            originalname: body.name || 'document.pdf',
            path: body.url || 'https://example.com/doc.pdf',
            size: body.size || 1024,
            mimetype: body.type || 'application/pdf'
        });
    }
}
