import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../src/metrics/metrics.service';
import { HttpMethodLabel } from '../../src/metrics/custom-metrics';

function normalizeMethod(method: string): HttpMethodLabel {
    const m = method.toUpperCase();
    switch (m) {
        case 'GET':
        case 'POST':
        case 'PUT':
        case 'PATCH':
        case 'DELETE':
        case 'OPTIONS':
        case 'HEAD':
            return m;
        default:
            return 'OTHER';
    }
}

function normalizeRoute(req: FastifyRequest): string {
    // Prefer Fastify route template rather than raw URL.
    const anyReq = req as unknown as { routeOptions?: { url?: string }; routerPath?: string };

    const r1 = anyReq.routeOptions?.url;
    if (typeof r1 === 'string' && r1.length > 0) return r1;

    const r2 = anyReq.routerPath;
    if (typeof r2 === 'string' && r2.length > 0) return r2;

    return (req.url || '').split('?')[0] || 'unknown';
}

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private metrics: MetricsService) { }

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
        const http = ctx.switchToHttp();
        const req = http.getRequest<FastifyRequest>();
        const res = http.getResponse<FastifyReply>();

        const start = process.hrtime.bigint();

        return next.handle().pipe(
            tap(() => {
                const path = (req.url || '').split('?')[0] || '';
                if (path === '/metrics') return;

                const end = process.hrtime.bigint();
                const durationSeconds = Number(end - start) / 1_000_000_000;

                this.metrics.recordHttpRequest({
                    method: normalizeMethod(req.method),
                    route: normalizeRoute(req),
                    status: res.statusCode,
                    durationSeconds,
                });
            }),
        );
    }
}