import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateOrgDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    country?: string;
}

export class UpdateMemberDto {
    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsString()
    status?: string;
}

export class CreateWalletDto {
    @IsOptional()
    @IsString()
    currency?: string;
}

export class CreateInviteDto {
    @IsEmail()
    email: string;

    @IsString()
    role: string;
}

export class AddDomainDto {
    @IsString()
    domain: string;
}

export class UpdateOrgSettingsDto {
    @IsOptional()
    @IsString()
    theme?: string;

    @IsOptional()
    @IsBoolean()
    mfaRequired?: boolean;
}

export class UpdateDomainDto {
    @IsOptional()
    @IsBoolean()
    primary?: boolean;
}

export class UpdateSSODto {
    @IsBoolean()
    enabled: boolean;

    @IsOptional()
    @IsString()
    providerUrl?: string;
}
