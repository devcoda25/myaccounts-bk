import { IsString, IsArray, IsEnum, IsUrl } from 'class-validator';

export class CreateApiKeyDto {
    @IsString()
    name: string;

    @IsArray()
    @IsString({ each: true })
    scopes: string[];
}

export class CreateOAuthClientDto {
    @IsString()
    name: string;

    @IsEnum(['confidential', 'public'])
    type: 'confidential' | 'public';

    @IsArray()
    @IsUrl({}, { each: true })
    redirectUris: string[];
}
