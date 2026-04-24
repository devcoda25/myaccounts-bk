import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_NAMESPACE,
    SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { KafkaJsInstrumentation } from '@opentelemetry/instrumentation-kafkajs';

export type OtelHandle = {
    sdk: NodeSDK;
    shutdown: () => Promise<void>;
};

function normalizeOtlpTracesUrl(base: string): string {
    // Accept either a full /v1/traces URL or a collector base URL.
    const trimmed = base.replace(/\/$/, '');
    if (trimmed.endsWith('/v1/traces')) return trimmed;
    return `${trimmed}/v1/traces`;
}

export async function startOpenTelemetry(): Promise<OtelHandle | null> {
    const enabled = (process.env.OBSERVABILITY_ENABLED ?? 'true') !== 'false'
        && (process.env.TRACING_ENABLED ?? 'true') !== 'false';

    if (!enabled) {
        return null;
    }

    const serviceName = process.env.OTEL_SERVICE_NAME || 'myaccounts';
    const serviceVersion = process.env.OTEL_SERVICE_VERSION;
    const serviceNamespace = process.env.OTEL_SERVICE_NAMESPACE;

    // Reduce noise unless explicitly enabled.
    const debugOtel = (process.env.OTEL_DIAGNOSTIC_LOG_LEVEL || '').toLowerCase() === 'debug';
    diag.setLogger(new DiagConsoleLogger(), debugOtel ? DiagLogLevel.DEBUG : DiagLogLevel.ERROR);

    const resource = resourceFromAttributes({
        [SEMRESATTRS_SERVICE_NAME]: serviceName,
        ...(serviceVersion ? { [SEMRESATTRS_SERVICE_VERSION]: serviceVersion } : {}),
        ...(serviceNamespace ? { [SEMRESATTRS_SERVICE_NAMESPACE]: serviceNamespace } : {}),
    });

    const exporterBase = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';
    const traceExporter = new OTLPTraceExporter({
        url: normalizeOtlpTracesUrl(exporterBase),
    });

    const sdk = new NodeSDK({
        resource,
        traceExporter,
        instrumentations: [
            // Broad coverage (HTTP, DNS, fs, ioredis, etc.)
            getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-kafkajs': { enabled: false } }),

            // Explicit coverage for core dependencies
            new PrismaInstrumentation(),
            new KafkaJsInstrumentation(),
        ],
    });

    await sdk.start();

    return {
        sdk,
        shutdown: () => sdk.shutdown(),
    };
}