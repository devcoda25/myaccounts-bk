import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                message = (exceptionResponse as any).message || exception.message;
                error = (exceptionResponse as any).error || exception.name;
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        } else {
            this.logger.error(`Unknown error: ${String(exception)}`);
        }

        // Sanitize error response - don't leak internal details
        const sanitizedMessage = this.sanitizeMessage(message, status);

        // Log error details
        if (status >= 500) {
            this.logger.error(`Server error: ${status} - ${sanitizedMessage}`, exception instanceof Error ? exception.stack : undefined);
        } else if (status >= 400) {
            this.logger.warn(`Client error: ${status} - ${sanitizedMessage}`);
        }

        response.status(status).json({
            statusCode: status,
            error: error,
            message: sanitizedMessage,
            timestamp: new Date().toISOString(),
            path: ctx.getRequest()?.url || 'unknown',
        });
    }

    /**
     * Sanitize error messages to prevent information leakage
     * In production, don't expose internal error details to clients
     */
    private sanitizeMessage(message: any, status: number): string {
        if (status >= 500) {
            // For server errors, return generic message in production
            if (process.env.NODE_ENV === 'production') {
                return 'An unexpected error occurred. Please try again later.';
            }
        }

        if (typeof message === 'string') {
            // Remove potential sensitive information
            return message
                .replace(/password[:\s]*\S+/gi, '[REDACTED]')
                .replace(/token[:\s]*\S+/gi, '[REDACTED]')
                .replace(/secret[:\s]*\S+/gi, '[REDACTED]')
                .replace(/key[:\s]*\S+/gi, '[REDACTED]');
        }

        if (Array.isArray(message)) {
            return message.join(', ');
        }

        return String(message);
    }
}
