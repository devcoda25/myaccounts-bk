import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum DeliveryMethod {
    EMAIL_LINK = 'email_link',
    SMS_CODE = 'sms_code',
    WHATSAPP_CODE = 'whatsapp_code'
}

export class ForgotPasswordDto {
    @IsString()
    @IsNotEmpty()
    identifier: string; // Email or Phone

    @IsOptional()
    @IsEnum(DeliveryMethod)
    deliveryMethod?: DeliveryMethod;
}
