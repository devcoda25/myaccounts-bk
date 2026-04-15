import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MinorApprovalService } from '../../services/auth/minor-approval.service';

@Controller('auth/minor-approval')
export class MinorApprovalController {
    constructor(private minorApprovalService: MinorApprovalService) { }

    // Child triggers resend (must be signed in to My Accounts)
    @Post('resend')
    @UseGuards(AuthGuard)
    async resend(@CurrentUser() user: AuthRequest['user']) {
        return this.minorApprovalService.resendForChild(user.sub);
    }

    // Parent/guardian approves (must be signed in)
    @Post('approve')
    @UseGuards(AuthGuard)
    async approve(
        @CurrentUser() user: AuthRequest['user'],
        @Body() body: { childId: string; token: string }
    ) {
        return this.minorApprovalService.approve(body.childId, body.token, { id: user.sub, email: user.email });
    }
}