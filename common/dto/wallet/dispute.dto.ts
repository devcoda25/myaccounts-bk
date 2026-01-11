import { IsString, IsNumber, IsOptional, Min, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDisputeDto {
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    amount: number;

    @IsString()
    currency: string;

    @IsString()
    reason: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    txnId?: string;
}

export class AddEvidenceDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsUrl() // Assuming strict URL
    @IsString()
    url?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    size?: number;

    @IsOptional()
    @IsString()
    type?: string;
}
