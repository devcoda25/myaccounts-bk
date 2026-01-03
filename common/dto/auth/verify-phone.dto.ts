import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPhoneDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}
