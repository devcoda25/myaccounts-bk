import { IsString, IsArray, IsBoolean, IsOptional, IsEnum, IsUrl } from 'class-validator';

export class AdminCreateOAuthClientDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    website?: string;

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

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;
}

export class AdminUpdateOAuthClientDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    website?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    redirectUris?: string[];

    @IsBoolean()
    @IsOptional()
    isFirstParty?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;

    @IsString()
    @IsOptional()
    color?: string;
}
