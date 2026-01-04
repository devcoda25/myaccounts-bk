import { Controller, Get, Post, Query, UseGuards, Param, Body, NotFoundException } from '@nestjs/common';
import { AdminDisputesService } from '../../services/admin/admin-disputes.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueryDto } from '../../common/dto/admin/admin.dto';

@Controller('admin/disputes')
@UseGuards(AuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class AdminDisputesController {
    constructor(private service: AdminDisputesService) { }

    @Get()
    async list(@Query() query: AdminQueryDto) {
        const skip = query.skip ? Number(query.skip) : 0;
        const take = query.take ? Number(query.take) : 10;
        return this.service.getDisputes(query.query || '', query.status || 'All', skip, take);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        return this.service.getDispute(id);
    }

    @Post(':id/resolve')
    async resolve(@Param('id') id: string, @Body() body: { decision: 'WON' | 'LOST', notes?: string }) {
        return this.service.resolveDispute(id, body.decision, body.notes);
    }

    // Stub for evidence upload - mainly for metadata in this phase
    @Post(':id/evidence')
    async addEvidence(@Param('id') id: string, @Body() body: any) {
        // In a real implementation this would likely be a multipart upload
        // Here we assume the file was uploaded to an S3 bucket and we are getting the metadata
        return this.service.addEvidence(id, {
            originalname: body.name || 'document.pdf',
            path: body.url || 'https://example.com/doc.pdf',
            size: body.size || 1024,
            mimetype: body.type || 'application/pdf'
        });
    }
}
