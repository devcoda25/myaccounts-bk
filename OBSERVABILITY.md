# MyAccounts Observability (Prometheus + OpenTelemetry + Pino)

This project exposes:

- **Prometheus metrics** at `GET /metrics`
- **OpenTelemetry traces** exported over **OTLP/HTTP** to `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318`)
- **Structured JSON logs** via **Pino**, with automatic **trace correlation** (`trace_id`, `span_id`) on request + error logs.

## Local stack (Prometheus + Grafana + Jaeger + Redis)

Start the observability stack:

```bash
docker compose -f docker-compose.observability.yml up -d
```

Ports (host -> container):

- Prometheus: `9090 -> 9090`
- Grafana: `3001 -> 3000` (avoids clashing with the API on `3000`)
- Jaeger UI: `16686 -> 16686`
- OTLP/HTTP ingest: `4318 -> 4318`
- Redis: `6379 -> 6379`

Grafana is provisioned automatically from `grafana/provisioning/`.

## Backend configuration

Required env flags (see `src/config/env.validation.ts`):

```bash
# Observability toggles
OBSERVABILITY_ENABLED=true
METRICS_ENABLED=true
TRACING_ENABLED=true

# Logging
LOG_LEVEL=info

# OpenTelemetry
OTEL_SERVICE_NAME=myaccounts
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
# optional:
# OTEL_DIAGNOSTIC_LOG_LEVEL=debug
```

Notes:

- Tracing is started in `main.ts` **before** Nest boots.
- Metrics can be disabled at runtime using `METRICS_ENABLED=false` (no-op).

## Where things live in the codebase

OpenTelemetry setup:

- `src/observability/otel.ts`
- `main.ts`

Structured logging:

- `src/observability/logger.ts` (Pino instance)
- `src/observability/app-logger.service.ts` (Nest injectable wrapper)
- `common/interceptors/request-logging.interceptor.ts` (adds `trace_id` / `span_id`)
- `common/filters/global-exception.filter.ts` (JSON error logs with correlation)

Prometheus metrics:

- `src/metrics/custom-metrics.ts`
- `src/metrics/metrics.service.ts`
- `common/interceptors/http-metrics.interceptor.ts`

Module wiring:

- `modules/observability/observability.module.ts`
- `app.module.ts` (registers interceptors + PrometheusModule)

## Prometheus metrics included

- `myaccounts_http_requests_total{method,route,status}`
- `myaccounts_http_request_duration_seconds{method,route,status}`
- `myaccounts_auth_login_total{method,outcome}`
- `myaccounts_auth_token_refresh_total{outcome}`
- `myaccounts_mfa_events_total{event,method,outcome}`
- `myaccounts_user_registrations_total{minor}`
- `myaccounts_minor_parent_approval_total{outcome}`
- `myaccounts_email_send_total{provider,outcome,type}`

## Replicating this in a sibling service (e.g. marketplace-api)

Copy these directories/files (adjust relative imports as needed):

- `src/observability/`
- `src/metrics/`
- `modules/observability/`
- `common/interceptors/request-logging.interceptor.ts`
- `common/interceptors/http-metrics.interceptor.ts`
- `common/filters/global-exception.filter.ts` (if you want the same error logging)
- `docker-compose.observability.yml`
- `prometheus.yml`
- `grafana/provisioning/`

Then update the sibling service:

1. Add deps:
   - `@opentelemetry/sdk-node`
   - `@opentelemetry/auto-instrumentations-node`
   - `@opentelemetry/exporter-trace-otlp-proto`
   - `@opentelemetry/resources`
   - `@opentelemetry/semantic-conventions`
   - `pino`
   - `prom-client`
   - `@willsoto/nestjs-prometheus`
   - plus instrumentations you need (`@opentelemetry/instrumentation-kafkajs`, Prisma instrumentation, etc.)

2. Start OTel in `main.ts` before bootstrapping.

3. Ensure `PrometheusModule.register({ path: '/metrics', ... })` is present, and exclude `GET /metrics` from global prefix.

4. Register the global interceptors:
   - `RequestLoggingInterceptor`
   - `HttpMetricsInterceptor`

5. Add env schema entries for the new flags.

## Quick validation checklist

- `GET /metrics` returns Prometheus output.
- Logs for a request include `trace_id` and `span_id`.
- Jaeger UI shows server spans for incoming HTTP traffic.
