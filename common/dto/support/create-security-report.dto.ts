import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export enum SecurityReportType {
    SUSPICIOUS_LOGIN = 'SUSPICIOUS_LOGIN',
    COMPROMISED_ACCOUNT = 'COMPROMISED_ACCOUNT',
    OTHER = 'OTHER'
}

export class CreateSecurityReportDto {
    @IsEnum(SecurityReportType)
    @IsNotEmpty()
    type: SecurityReportType;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsOptional()
    metadata?: any;
}
