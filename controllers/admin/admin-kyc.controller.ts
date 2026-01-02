import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { KycService } from '../../services/kyc/kyc.service';

@Controller('admin/kyc')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN') // Staff/Admin access
export class AdminKycController {
    constructor(private kycService: KycService) { }

    @Get()
    async getRequests(@Query() query: any) {
        return this.kycService.getAllRequests({
            skip: query.skip ? Number(query.skip) : 0,
            take: query.take ? Number(query.take) : 10,
            status: query.status,
            query: query.query
        });
    }

    @Post(':id/review')
    async reviewRequest(@Param('id') id: string, @Body() body: { action: 'APPROVE' | 'REJECT', reason?: string }) {
        return this.kycService.reviewRequest(id, body.action, body.reason);
    }
}
