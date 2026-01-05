import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { validateEnv } from '../utils/env.validation';

export const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Enforce parsing/validation inside the callback or singleton?
        // env.validation.ts parses on import in some patterns, but here we can just parse process.env
        // Optimization: In real-world, we'd cache this config.
        const config = validateEnv(process.env);
        const allowed = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());

        // Strict logic: Only production requires origin match. Dev allows strictness relaxation IF strictly coded.
        const isAllowed = !origin || allowed.includes(origin) || config.NODE_ENV !== 'production';

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'x-api-key'],
};
