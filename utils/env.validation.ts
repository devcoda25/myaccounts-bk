import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),

    // Security Secrets
    COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters long"),

    // CORS
    ALLOWED_ORIGINS: z.string().min(1, "ALLOWED_ORIGINS must be defined"),

    // API Keys (Optional but strictly validated if present)
    APWGAPI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
    const result = envSchema.safeParse(config);

    if (!result.success) {
        console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
        // Throwing error here to crash the app intentionally
        throw new Error('Invalid environment configuration');
    }

    return result.data;
}
