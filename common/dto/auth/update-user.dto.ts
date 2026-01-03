import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    otherNames?: string;

    @IsDateString() // Or IsString if frontend sends raw date string
    @IsOptional()
    dob?: string;

    @IsString()
    @IsOptional()
    country?: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;
}
