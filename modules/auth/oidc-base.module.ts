import { Module } from '@nestjs/common';
import { OidcConfigController } from '../../controllers/auth/oidc-config.controller';
import { JwksController } from '../../controllers/auth/jwks.controller';

@Module({
    controllers: [OidcConfigController, JwksController],
})
export class OidcBaseModule { }
