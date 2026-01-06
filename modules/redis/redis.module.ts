import { Module, Global, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { validateEnv } from '../../utils/env.validation';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: () => {
        const config = validateEnv(process.env);
        const redis = new Redis(config.REDIS_URL);

        redis.on('error', (err: any) => {
            console.error('Redis Error:', err);
        });

        redis.on('connect', () => {
            console.log('Redis Connected');
        });

        return redis;
    },
};

@Global()
@Module({
    providers: [redisProvider],
    exports: [redisProvider],
})
export class RedisModule { }
