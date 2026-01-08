import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { Prisma } from '@prisma/client';

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
    name?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsBoolean()
    walletEnabled?: boolean;

    @IsOptional()
    @IsBoolean()
    ssoEnabled?: boolean;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    logoDataUrl?: string;

    @IsOptional()
    @IsString()
    defaultRolePolicy?: string;
}

export class UpdateDomainDto {
    @IsOptional()
    @IsBoolean()
    requireSso?: boolean;

    @IsOptional()
    @IsBoolean()
    allowPasswordFallback?: boolean;

    @IsOptional()
    @IsString()
    defaultRole?: string;
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
    config?: Prisma.InputJsonValue;
}

export class UpdateOrgPermissionsDto {
    @IsOptional()
    grants?: Prisma.InputJsonValue;


    @IsOptional()
    policy?: Prisma.InputJsonValue;
}

export class CreateRoleDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: Prisma.InputJsonValue;
}

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    permissions?: Prisma.InputJsonValue;
}
