import { Module, Global } from '@nestjs/common';
import { JwkService } from './services/jwk.service';
import { AuthCacheService } from './services/auth-cache.service';
import { RedisModule } from '../modules/redis/redis.module';

@Global()
@Module({
    imports: [RedisModule],
    providers: [
        JwkService,
        AuthCacheService
    ],
    exports: [
        JwkService,
        AuthCacheService
    ],
})
export class CommonModule { }
