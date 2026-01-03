import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @IsString()
    @IsNotEmpty()
    identifier: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}
