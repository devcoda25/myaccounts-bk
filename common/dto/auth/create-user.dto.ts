import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    @IsNotEmpty()
    otherNames: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    countryCode?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @MinLength(8)
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    inviteCode?: string;

    @IsNotEmpty()
    acceptTerms: boolean;
}
