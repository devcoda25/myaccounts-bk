import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, IsDateString } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(100)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(200)
    otherNames: string;

    @IsEmail()
    @IsOptional()
    @MaxLength(255)
    email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    countryCode?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    phone?: string;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    country?: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @IsOptional()
    password?: string;

    // Date of birth used for age gating (under-18 parental approval).
    @IsDateString()
    @IsOptional()
    dob?: string;

    // Required only when dob indicates age < 18.
    @IsEmail()
    @IsOptional()
    @MaxLength(255)
    parentEmail?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    inviteCode?: string;

    @IsNotEmpty()
    acceptTerms: boolean;
}