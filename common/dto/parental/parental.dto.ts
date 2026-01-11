import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Prisma } from '@prisma/client';

export class LinkChildDto {
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class UpdateHouseholdModeDto {
    @IsString()
    @IsNotEmpty()
    mode: string;
}

export class DecideApprovalDto {
    @IsBoolean()
    approve: boolean;
}

export class CreateChildDto {
    @IsString()
    name: string;

    @IsString()
    dob: string;
}

export class UpdateChildDto {
    @IsOptional()
    @IsObject()
    patch?: Prisma.ChildProfileUpdateInput;

    @IsOptional()
    @IsObject()
    audit?: { kind: string; summary: string; severity?: string };
}

export class InviteHouseholdMemberDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    role: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsObject()
    channels?: any;
}
