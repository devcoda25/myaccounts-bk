import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

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
    @IsString()
    patch?: any; // Keeping as any or specific object if known, but better than implicit any in controller

    @IsOptional()
    @IsString()
    audit?: string;
}
