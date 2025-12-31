import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum DeliveryMethod {
    EMAIL_LINK = 'email_link',
    SMS_CODE = 'sms_code',
    WHATSAPP_CODE = 'whatsapp_code'
}

export class ForgotPasswordDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsEnum(DeliveryMethod)
    @IsNotEmpty()
    delivery: DeliveryMethod;
}
