import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KycService } from '../../services/kyc/kyc.service';
import { FastifyRequest } from 'fastify';
import { extname, join } from 'path';
import { createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);



@Controller('kyc')
@UseGuards(AuthGuard)
export class KycController {
    constructor(private kycService: KycService) { }

    @Get('status')
    async getStatus(@CurrentUser() user: any) {
        // user.id is assumed from auth guard
        return this.kycService.getStatus(user.sub || user.id);
    }

    // Since our details form sends "docType" and the upload form sends files separately or we do everything in one go?
    // The previous frontend has "Upload" then "Submit" which presumably sends everything. 
    // However, the upload tool `WalletKycUpload` currently uploads via local state.
    // Let's implement a real upload endpoint for files, returning URLs, then a submit for data.

    @Post('upload')
    async uploadFiles(@Req() req: FastifyRequest): Promise<any> {
        const parts = req.files();
        const response = [];

        for await (const part of parts) {
            const fileExtName = extname(part.filename);
            const randomName = Array(4).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
            const filename = `${part.filename.split('.')[0]}-${randomName}${fileExtName}`;
            const savePath = join(process.cwd(), 'uploads', 'kyc', filename);

            // Ensure dir exists
            await fs.mkdir(join(process.cwd(), 'uploads', 'kyc'), { recursive: true });

            await pump(part.file, createWriteStream(savePath));

            response.push({
                originalName: part.filename,
                filename: filename,
                url: `/uploads/kyc/${filename}`,
            });
        }
        return response;
    }

    @Post('submit')
    async submit(@CurrentUser() user: any, @Body() body: any) {
        // body should contain { files: [{slot: 'idFront', url: '...'}], docType: '...', level: 1|2 }
        return this.kycService.submitKyc(user.sub || user.id, body.files, body.docType || 'ID_CARD', body.level || 1);
    }
}
