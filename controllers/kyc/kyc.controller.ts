import { Controller, Get, Post, Body, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KycService } from '../../services/kyc/kyc.service';
import { FastifyRequest } from 'fastify';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { SubmitKycDto } from '../../common/dto/kyc/kyc.dto';
import { StorageService } from '../../modules/storage/storage.service';





@Controller('kyc')
@UseGuards(AuthGuard)
export class KycController {
    constructor(
        private kycService: KycService,
        private storageService: StorageService
    ) { }

    @Get('status')
    async getStatus(@CurrentUser() user: AuthRequest['user']) {
        return this.kycService.getStatus(user.sub || (user as any).id);
    }

    // Since our details form sends "docType" and the upload form sends files separately or we do everything in one go?
    // The previous frontend has "Upload" then "Submit" which presumably sends everything. 
    // However, the upload tool `WalletKycUpload` currently uploads via local state.
    // Let's implement a real upload endpoint for files, returning URLs, then a submit for data.

    @Post('upload')
    async uploadFiles(@Req() req: FastifyRequest): Promise<any> {
        const parts = req.files();
        const response = [];

        // [Security] Rule B: Magic Byte Validation
        const { fileTypeFromBuffer } = await eval('import("file-type")');
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

        for await (const part of parts) {
            const fileBuffer = await part.toBuffer();
            const type = await fileTypeFromBuffer(fileBuffer);

            if (!type || !allowedMimes.includes(type.mime)) {
                // Skip or throw? For multi-upload, throwing aborts all. Let's throw to be strict.
                throw new UnauthorizedException(`Invalid file type for ${part.filename}. Only Images and PDF allowed.`);
            }

            const fileExtName = `.${type.ext}`;
            // [Security] Rule B: Secure Random Method
            const randomName = randomBytes(16).toString('hex');
            // Use original name sanitized or just random? simpler to be random-ish but keep prefix
            const safePrefix = part.filename.split('.')[0].replace(/[^a-zA-Z0-9-]/g, '');
            const finalPrefix = safePrefix || 'file'; // Fallback if name is all special chars
            const filename = `${finalPrefix}-${randomName}${fileExtName}`;
            // 1M Users: Partition by Date or UserId to avoid massive flat directories
            // UserId is best for KYC.
            const userSub = (req as any).user?.sub || (req as any).user?.id || 'anonymous';
            const key = `kyc/${userSub}/${filename}`;

            await this.storageService.upload(key, fileBuffer, type.mime);

            // Generate Signed URL for immediate viewing/confirmation by frontend
            const signedUrl = await this.storageService.getSignedUrl(key, 3600);

            response.push({
                originalName: part.filename,
                filename: key,
                url: signedUrl,
            });
        }
        return response;
    }

    @Post('submit')
    async submit(@CurrentUser() user: AuthRequest['user'], @Body() body: SubmitKycDto) {
        return this.kycService.submitKyc(user.sub || (user as any).id, body.files, body.docType, body.level);
    }
}
