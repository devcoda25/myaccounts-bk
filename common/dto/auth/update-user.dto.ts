import { IsString, IsOptional, IsDateString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    @IsString()
    @IsOptional()
    @MinLength(1)
    @MaxLength(200)
    otherNames?: string;

    @IsDateString()
    @IsOptional()
    dob?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    country?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    avatarUrl?: string;
}
