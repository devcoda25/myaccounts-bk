import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class AdminQueryDto {
    @IsOptional()
    @IsNumber()
    skip?: number;

    @IsOptional()
    @IsNumber()
    take?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    query?: string;
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
