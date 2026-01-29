import { IsNotEmpty, IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';

export enum SupportCategory {
    BILLING = 'Billing',
    TECHNICAL = 'Technical',
    PRIVACY = 'Privacy',
    GENERAL = 'General'
}

export class CreateSupportTicketDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    subject: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    description: string;

    @IsEnum(SupportCategory)
    @IsNotEmpty()
    category: SupportCategory;

    @IsOptional()
    metadata?: Record<string, unknown>;
}
