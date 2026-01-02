import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestPhoneVerificationDto {
    @IsString()
    @IsNotEmpty()
    identifier: string; // phone number

    @IsString()
    @IsOptional()
    deliveryMethod?: string; // sms_code, whatsapp_code
}
