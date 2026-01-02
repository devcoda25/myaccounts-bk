import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { KeyManager } from '../../utils/keys';

@ApiTags('OIDC Configuration')
@Controller('jwks')
export class JwksController {
    @Get()
    @ApiOperation({ summary: 'Get JSON Web Key Set' })
    async getJwks() {
        const publicKey = await KeyManager.getPublicJWK();
        return {
            keys: [publicKey]
        };
    }
}
