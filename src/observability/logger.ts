import pino, { Logger as PinoLogger } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function getLogLevel(): LogLevel {
    const lvl = (process.env.LOG_LEVEL || 'info').toLowerCase();
    switch (lvl) {
        case 'trace':
        case 'debug':
        case 'info':
        case 'warn':
        case 'error':
        case 'fatal':
            return lvl;
        default:
            return 'info';
    }
}

const redactPaths: string[] = [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers.set-cookie',
    'req.headers.x-api-key',
    'req.body.password',
    'req.body.token',
    'req.body.refresh_token',
    'req.body.client_secret',
    'res.headers.set-cookie',
];

export function createLogger(): PinoLogger {
    return pino({
        level: getLogLevel(),
        base: {
            service: process.env.OTEL_SERVICE_NAME || 'myaccounts',
            env: process.env.NODE_ENV || 'development',
        },
        redact: {
            paths: redactPaths,
            remove: true,
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    });
}

// Singleton logger used across the app.
export const appLogger = createLogger();