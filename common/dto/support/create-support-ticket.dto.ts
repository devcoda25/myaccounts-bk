import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

export enum SupportCategory {
    BILLING = 'Billing',
    TECHNICAL = 'Technical',
    PRIVACY = 'Privacy',
    GENERAL = 'General'
}

export class CreateSupportTicketDto {
    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsEnum(SupportCategory)
    @IsNotEmpty()
    category: SupportCategory;

    @IsOptional()
    metadata?: any;
}
