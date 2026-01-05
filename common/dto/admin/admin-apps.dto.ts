import { IsString, IsArray, IsBoolean, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class AdminCreateOAuthClientDto {
    @IsString()
    name: string;

    @IsEnum(['confidential', 'public'])
    type: 'confidential' | 'public';

    @IsArray()
    @IsString({ each: true })
    redirectUris: string[];

    @IsBoolean()
    @IsOptional()
    isFirstParty?: boolean;

    @IsString()
    @IsOptional()
    clientId?: string; // Optional: can be provided or auto-generated
}

export class AdminUpdateOAuthClientDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    redirectUris?: string[];

    @IsBoolean()
    @IsOptional()
    isFirstParty?: boolean;
}
