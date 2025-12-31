import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UserQueryService } from '../../services/users/user-query.service';
import { UserManagementService } from '../../services/users/user-management.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from '../../common/dto/update-user.dto';

@Controller('users')
export class UserProfileController {
    constructor(
        private userQueryService: UserQueryService,
        private userManagementService: UserManagementService
    ) { }

    @Get('me')
    @UseGuards(AuthGuard)
    async getProfile(@CurrentUser() user: any) {
        return this.userQueryService.findById(user.sub || user.id);
    }

    @Put('me')
    @UseGuards(AuthGuard)
    async updateProfile(@CurrentUser() user: any, @Body() body: UpdateUserDto) {
        return this.userManagementService.updateProfile(user.sub || user.id, body);
    }
}
