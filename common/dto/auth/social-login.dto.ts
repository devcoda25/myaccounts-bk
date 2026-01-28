import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SocialLoginDto {
    @IsString()
    @IsNotEmpty()
    token: string;

    @IsString()
    @IsOptional()
    uid?: string;
}
