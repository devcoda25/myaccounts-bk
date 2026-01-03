import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    identifier: string; // Email or Phone

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsOptional()
    rememberMe?: boolean;
}
