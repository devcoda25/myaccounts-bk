import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    skip?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    take?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    query?: string;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    outcome?: string;

    @IsOptional()
    @IsString()
    risk?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    order?: string;
}

export class UpdateWalletStatusDto {
    @IsEnum(['FREEZE', 'UNFREEZE'])
    action: 'FREEZE' | 'UNFREEZE';
}

export class ReviewKycDto {
    @IsEnum(['APPROVE', 'REJECT'])
    action: 'APPROVE' | 'REJECT';

    @IsOptional()
    @IsString()
    reason?: string;
}
