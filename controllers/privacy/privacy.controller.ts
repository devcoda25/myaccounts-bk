import { Controller, Post, UseGuards } from '@nestjs/common';
import { PrivacyService } from '../../services/privacy/privacy.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';

@Controller('privacy')
@UseGuards(AuthGuard)
export class PrivacyController {
    constructor(private readonly service: PrivacyService) { }

    @Post('export')
    async requestExport(@CurrentUser() user: AuthRequest['user']) {
        return this.service.exportUserData(user.id);
    }
}
