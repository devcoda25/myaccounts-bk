import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
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

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private logger: AppLogger) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<FastifyRequest>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: unknown = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse as Record<string, unknown>;
                message = responseObj.message ?? exception.message;
                error = (responseObj.error as string) || exception.name;
            } else {
                message = exceptionResponse;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        const sanitizedMessage = this.sanitizeMessage(message, status);

        const meta = {
            ...getTraceMeta(),
            req: {
                method: request.method,
                path: (request.url || '').split('?')[0],
            },
            res: {
                status_code: status,
            },
            err: exception instanceof Error
                ? { name: exception.name, message: exception.message, stack: exception.stack }
                : { value: String(exception) },
        };

        if (status >= 500) {
            this.logger.error(meta, `server_error: ${status}`);
        } else if (status >= 400) {
            this.logger.warn(meta, `client_error: ${status}`);
        }

        const errorResponse = {
            statusCode: status,
            error,
            message: sanitizedMessage,
            timestamp: new Date().toISOString(),
            path: request.url || 'unknown',
        };

        response.status(status).send(errorResponse);
    }

    private sanitizeMessage(message: unknown, status: number): string {
        if (status >= 500 && process.env.NODE_ENV === 'production') {
            return 'An unexpected error occurred. Please try again later.';
        }

        if (typeof message === 'string') {
            return message
                .replace(/password[:\s]*\S+/gi, '[REDACTED]')
                .replace(/token[:\s]*\S+/gi, '[REDACTED]')
                .replace(/secret[:\s]*\S+/gi, '[REDACTED]')
                .replace(/key[:\s]*\S+/gi, '[REDACTED]');
        }

        if (Array.isArray(message)) {
            return message.map((m) => String(m)).join(', ');
        }

        return String(message);
    }
}