import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TransactionQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    take?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    skip?: number;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}

export class CreateTransactionDto {
    @IsNumber()
    @Min(0.01)
    amount: number;

    @IsString()
    type: string;

    @IsString()
    status: string;

    @IsOptional()
    @IsString()
    reference?: string;

    @IsOptional()
    @IsString()
    providerRef?: string;

    @IsOptional()
    @IsString()
    counterparty?: string;

    @IsOptional()
    @IsString()
    channel?: string;

    @IsOptional()
    @IsString()
    note?: string;
}

export class FundWalletDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsOptional()
    @IsString()
    currency?: string = 'UGX';

    @IsString()
    method: string; // "mobile_money", "card"

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    accountNumber?: string;
}
