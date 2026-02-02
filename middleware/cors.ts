import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { validateEnv } from '../utils/env.validation';

export const corsOptions: CorsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        const config = validateEnv(process.env);
        const allowed = [
            ...config.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
            'https://accounts.evzone.app',
            'https://api.evzone.app'
        ];

        const isAllowed = !origin || allowed.includes(origin) || config.NODE_ENV !== 'production';

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    // [Security] Allow CSRF token header for double-submit cookie pattern
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'x-user-id',
        'x-api-key',
        'x-csrf-token'  // Added for CSRF protection
    ],
    exposedHeaders: ['Location', 'Set-Cookie', 'x-csrf-token'],
};
