import 'dotenv/config';
import 'reflect-metadata';

import { bootstrap } from './server/server';
import { appLogger } from './src/observability/logger';
import { startOpenTelemetry } from './src/observability/otel';

async function main() {
    let otel: Awaited<ReturnType<typeof startOpenTelemetry>> = null;

    try {
        otel = await startOpenTelemetry();
        if (otel) {
            appLogger.info({ service: process.env.OTEL_SERVICE_NAME || 'myaccounts' }, 'otel_started');
        } else {
            appLogger.info({}, 'otel_disabled');
        }
    } catch (err) {
        // Tracing must never prevent the app from starting.
        appLogger.error({ err }, 'otel_start_failed');
    }

    const gracefulShutdown = async () => {
        appLogger.info({}, 'shutdown_signal');
        try {
            await otel?.shutdown();
        } catch (err) {
            appLogger.error({ err }, 'otel_shutdown_failed');
        } finally {
            process.exit(0);
        }
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    await bootstrap();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();