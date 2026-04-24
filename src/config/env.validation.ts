import { z } from 'zod';

// Central env schema (used across NestJS modules and main.ts).
// Keep defaults here so dev can boot with minimal config.
export const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),

    // Core infra
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),

    // App config
    FRONTEND_URL: z.string().default('https://accounts.evzone.app'),

    // Security
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters long'),
    COOKIE_DOMAIN: z.string().optional(),

    // CORS
    ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS must be defined'),

    // Kafka
    KAFKA_BROKERS: z.string().min(1).describe('Comma separated brokers (e.g. localhost:9092)'),
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
    S3_ENDPOINT: z.string().min(1),
    S3_REGION: z.string().default('us-east-1'),
    S3_BUCKET: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),

    // Optional API keys
    APWGAPI_API_KEY: z.string().optional(),

    // Observability feature toggles
    OBSERVABILITY_ENABLED: z.coerce.boolean().default(true),
    METRICS_ENABLED: z.coerce.boolean().default(true),
    TRACING_ENABLED: z.coerce.boolean().default(true),
    LOG_JSON: z.coerce.boolean().default(true),

    // Observability: Logging
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

    // Observability: OpenTelemetry
    OTEL_SERVICE_NAME: z.string().default('myaccounts'),
    OTEL_SERVICE_VERSION: z.string().optional(),
    OTEL_SERVICE_NAMESPACE: z.string().optional(),

    // Base collector endpoint; we append /v1/traces automatically in code when needed.
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),

    // Diagnostic logging for OpenTelemetry SDK (set to debug only when needed)
    OTEL_DIAGNOSTIC_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    OTEL_EXPORTER_OTLP_INSECURE: z.coerce.boolean().default(true),

    // Optional sampling controls
    OTEL_TRACES_SAMPLER: z.string().optional(),
    OTEL_TRACES_SAMPLER_ARG: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>) {
    const result = envSchema.safeParse(config);

    if (!result.success) {
        // Crash early on misconfig.
        console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
        throw new Error('Invalid environment configuration');
    }

    return result.data;
}