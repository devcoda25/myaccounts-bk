import { IsString, IsArray, IsNumber, IsOptional } from 'class-validator';

export class SubmitKycDto {
    @IsArray()
    files: Array<{ slot: string; url: string }>;

    @IsString()
    docType: string;

    @IsNumber()
    level: number;
}
