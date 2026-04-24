import {
    Body,
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Post,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { AuthCacheService } from '../../common/services/auth-cache.service';
import { MfaVerificationDto } from '../../common/dto/auth/mfa.dto';
import { MfaService } from '../../services/auth/mfa.service';
import { MetricsService } from '../../src/metrics/metrics.service';
import type { MfaMethodLabel } from '../../src/metrics/custom-metrics';

function methodFromSetupMethod(method?: 'authenticator' | 'sms' | 'whatsapp'): MfaMethodLabel {
    switch (method) {
        case 'authenticator':
            return 'totp';
        case 'sms':
            return 'sms';
        case 'whatsapp':
            return 'whatsapp';
        default:
            return 'unknown';
    }
}

function methodFromChannel(channel: 'authenticator' | 'sms' | 'whatsapp' | 'email'): MfaMethodLabel {
    switch (channel) {
        case 'authenticator':
            return 'totp';
        case 'sms':
            return 'sms';
        case 'whatsapp':
            return 'whatsapp';
        case 'email':
            return 'email';
        default:
            return 'unknown';
    }
}

@Controller('auth/mfa')
@UseGuards(AuthGuard)
export class MfaController {
    constructor(
        private mfaService: MfaService,
        private authCache: AuthCacheService,
        private metrics: MetricsService,
    ) { }

    /**
     * Check MFA-specific rate limit using Redis
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
        const result = await this.mfaService.generateSecret(req.user.sub);
        this.metrics.recordMfaEvent('setup_start', 'totp', 'success');
        return result;
    }

    @Post('setup/sms/send')
    async sendSmsCode(@Req() req: AuthRequest, @Body() body: { phone: string }) {
        await this.checkMfaRateLimit(req.user.sub, 'setup-sms-send', 3, 60000);
        if (!body.phone) throw new BadRequestException('Phone number required');

        const result = await this.mfaService.sendSmsCode(req.user.sub, body.phone);
        this.metrics.recordMfaEvent('sms_send', 'sms', result.success ? 'success' : 'failure');
        return result;
    }

    @Post('setup/verify')
    async verifySetup(
        @Req() req: AuthRequest,
        @Body() body: MfaVerificationDto & { phone?: string; method?: 'authenticator' | 'sms' | 'whatsapp' },
    ) {
        await this.checkMfaRateLimit(req.user.sub, 'setup-verify', 5, 60000);
        const method = methodFromSetupMethod(body.method || 'authenticator');
        const result = await this.mfaService.verifyAndEnable(req.user.sub, body.token, body.secret, body.method || 'authenticator', body.phone);
        this.metrics.recordMfaEvent('setup_verify', method, 'success');
        return result;
    }

    @Post('disable')
    async disable(@Req() req: AuthRequest) {
        await this.checkMfaRateLimit(req.user.sub, 'disable', 3, 60000);
        const result = await this.mfaService.disable(req.user.sub);
        this.metrics.recordMfaEvent('disable', 'unknown', 'success');
        return result;
    }

    @Post('recovery-codes')
    async regenerateCodes(@Req() req: AuthRequest) {
        await this.checkMfaRateLimit(req.user.sub, 'recovery-codes', 3, 60000);
        const result = await this.mfaService.regenerateRecoveryCodes(req.user.sub);
        this.metrics.recordMfaEvent('recovery_codes', 'unknown', 'success');
        return result;
    }

    @Post('challenge/send')
    async sendChallenge(@Req() req: AuthRequest, @Body() body: { channel: 'sms' | 'whatsapp' | 'email' }) {
        await this.checkMfaRateLimit(req.user.sub, 'challenge-send', 3, 60000);
        const result = await this.mfaService.sendChallenge(req.user.sub, body.channel);
        this.metrics.recordMfaEvent('challenge_send', methodFromChannel(body.channel), result.success ? 'success' : 'failure');
        return result;
    }

    @Post('challenge/verify')
    async verifyChallenge(@Req() req: AuthRequest, @Body() body: { code: string; channel: 'authenticator' | 'sms' | 'whatsapp' | 'email' }) {
        await this.checkMfaRateLimit(req.user.sub, 'challenge-verify', 5, 60000);
        const result = await this.mfaService.verifyChallenge(req.user.sub, body.code, body.channel);
        this.metrics.recordMfaEvent('challenge_verify', methodFromChannel(body.channel), result.success ? 'success' : 'failure');
        return result;
    }
}