import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException, Req, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { MfaService } from '../../services/auth/mfa.service';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { MfaVerificationDto } from '../../common/dto/auth/mfa.dto';
import { AuthCacheService } from '../../common/services/auth-cache.service';

@Controller('auth/mfa')
@UseGuards(AuthGuard)
export class MfaController {
    constructor(
        private mfaService: MfaService,
        private authCache: AuthCacheService
    ) { }

    /**
     * Check MFA-specific rate limit using Redis
     * @param userId - User ID for rate limiting
     * @param endpoint - Endpoint identifier
     * @param maxRequests - Maximum requests allowed
     * @param windowMs - Time window in milliseconds
     */
    private async checkMfaRateLimit(userId: string, endpoint: string, maxRequests: number, windowMs: number): Promise<void> {
        const key = `mfa_rate:${userId}:${endpoint}`;
        const current = await this.authCache.incr(key);

        if (current === 1) {
            await this.authCache.expire(key, Math.ceil(windowMs / 1000));
        }

        if (current > maxRequests) {
            const ttl = await this.authCache.ttl(key);
            throw new HttpException({
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                error: 'Too Many Requests',
                message: 'MFA rate limit exceeded. Please try again later.',
                retryAfter: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
            }, HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Get('status')
    async getStatus(@Req() req: AuthRequest) {
        return this.mfaService.getStatus(req.user.sub);
    }

    @Post('setup/start')
    async startSetup(@Req() req: AuthRequest) {
        await this.checkMfaRateLimit(req.user.sub, 'setup-start', 5, 60000);
        return this.mfaService.generateSecret(req.user.sub);
    }

    @Post('setup/sms/send')
    async sendSmsCode(@Req() req: AuthRequest, @Body() body: { phone: string }) {
        console.log(`[MFA] SMS send request for user ${req.user.sub}, phone: ${body.phone}`);
        await this.checkMfaRateLimit(req.user.sub, 'setup-sms-send', 3, 60000);
        if (!body.phone) throw new BadRequestException('Phone number required');
        const result = await this.mfaService.sendSmsCode(req.user.sub, body.phone);
        console.log(`[MFA] SMS send result:`, result);
        return result;
    }

    @Post('setup/verify')
    async verifySetup(@Req() req: AuthRequest, @Body() body: MfaVerificationDto & { phone?: string; method?: 'authenticator' | 'sms' | 'whatsapp' }) {
        await this.checkMfaRateLimit(req.user.sub, 'setup-verify', 5, 60000);
        return this.mfaService.verifyAndEnable(req.user.sub, body.token, body.secret, body.method || 'authenticator', body.phone);
    }

    @Post('disable')
    async disable(@Req() req: AuthRequest) {
        await this.checkMfaRateLimit(req.user.sub, 'disable', 3, 60000);
        // In real world, require password re-auth here
        return this.mfaService.disable(req.user.sub);
    }

    @Post('recovery-codes')
    async regenerateCodes(@Req() req: AuthRequest) {
        await this.checkMfaRateLimit(req.user.sub, 'recovery-codes', 3, 60000);
        return this.mfaService.regenerateRecoveryCodes(req.user.sub);
    }

    @Post('challenge/send')
    async sendChallenge(@Req() req: AuthRequest, @Body() body: { channel: 'sms' | 'whatsapp' | 'email' }) {
        await this.checkMfaRateLimit(req.user.sub, 'challenge-send', 3, 60000);
        return this.mfaService.sendChallenge(req.user.sub, body.channel);
    }

    @Post('challenge/verify')
    async verifyChallenge(@Req() req: AuthRequest, @Body() body: { code: string; channel: 'authenticator' | 'sms' | 'whatsapp' | 'email' }) {
        await this.checkMfaRateLimit(req.user.sub, 'challenge-verify', 5, 60000);
        return this.mfaService.verifyChallenge(req.user.sub, body.code, body.channel);
    }
}
