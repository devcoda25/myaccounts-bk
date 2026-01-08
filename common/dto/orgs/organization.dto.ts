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
    isEnabled: boolean;

    @IsString()
    provider: string;

    @IsOptional()
    @IsString()
    providerUrl?: string;

    @IsOptional()
    config?: any;
}

export class UpdateOrgPermissionsDto {
    @IsOptional()
    grants?: any; // To be strictly typed later if possible

    @IsOptional()
    policy?: {
        defaultInviteRole?: string;
        requireAdminApproval?: boolean;
        requireMfaForAdmins?: boolean;
    };
}

export class CreateRoleDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: string; // JSON object for granular permissions
}

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: string;
}
