import { IsString, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    oldPassword: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    newPassword: string;

    @IsOptional()
    @IsBoolean()
    logoutOthers?: boolean;
}
