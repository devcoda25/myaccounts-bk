import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),

    // App Config
    FRONTEND_URL: z.string().url().default('https://accounts.evzone.app'),

    // Security Secrets
    COOKIE_SECRET: z.string().min(32, "COOKIE_SECRET must be at least 32 characters long"),
    COOKIE_DOMAIN: z.string().optional(),


    // CORS
    ALLOWED_ORIGINS: z.string().min(1, "ALLOWED_ORIGINS must be defined"),

    // Infrastructure
    REDIS_URL: z.string().url().describe('Redis Connection URL (redis://...)'),

    // Kafka
    KAFKA_BROKERS: z.string().describe('Comma separated brokers (e.g. localhost:9092)'),
    KAFKA_CLIENT_ID: z.string().default('myaccounts-service'),
    KAFKA_GROUP_ID: z.string().default('myaccounts-consumer-group'),
    KAFKA_USERNAME: z.string().optional(),
    KAFKA_PASSWORD: z.string().optional(),
    KAFKA_SSL: z.coerce.boolean().default(true),

    // Kafka Topics
    KAFKA_TOPIC_MAIL_SEND: z.string().default('mail.send'),
    KAFKA_TOPIC_USER_LOGGED_IN: z.string().default('auth.user.login'),
    KAFKA_TOPIC_USER_LOCKED: z.string().default('auth.user.locked'),

    // Object Storage (DO Spaces / S3)
    S3_ENDPOINT: z.string().url(),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),

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
