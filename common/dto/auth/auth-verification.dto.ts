import { IsString, IsNotEmpty, IsEnum, IsEmail } from 'class-validator';

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}

export class VerifyPhoneDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}

export class RequestPhoneVerificationDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsEnum(['sms_code', 'whatsapp_code'])
    deliveryMethod: 'sms_code' | 'whatsapp_code';
}
