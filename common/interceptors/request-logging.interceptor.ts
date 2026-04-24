import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { context, trace } from '@opentelemetry/api';
import { AppLogger } from '../../src/observability/app-logger.service';

function getTraceMeta() {
    const span = trace.getSpan(context.active());
    const spanCtx = span?.spanContext();

    return {
        trace_id: spanCtx?.traceId,
        span_id: spanCtx?.spanId,
    };
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
    constructor(private logger: AppLogger) { }

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = ctx.switchToHttp();
        const req = http.getRequest<FastifyRequest>();
        const res = http.getResponse<FastifyReply>();

        const start = process.hrtime.bigint();

        // Avoid noisy endpoints
        const path = req.url?.split('?')[0] || '';
        const skip = path === '/metrics' || path === '/health';

        return next.handle().pipe(
            tap(() => {
                if (skip) return;
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1_000_000;

                const meta = {
                    ...getTraceMeta(),
                    req: {
                        method: req.method,
                        path,
                        // Prefer Fastify IP, but fall back to XFF.
                        ip: (req.ip as string | undefined) || (req.headers['x-forwarded-for'] as string | undefined),
                        user_agent: req.headers['user-agent'],
                    },
                    res: {
                        status_code: res.statusCode,
                    },
                    duration_ms: Math.round(durationMs),
                };

                this.logger.info(meta, 'http_request');
            }),
            catchError((err) => {
                if (!skip) {
                    const meta = {
                        ...getTraceMeta(),
                        req: { method: req.method, path },
                        err: {
                            name: err?.name,
                            message: err?.message,
                        },
                    };
                    this.logger.error(meta, 'http_request_error');
                }
                throw err;
            }),
        );
    }
}