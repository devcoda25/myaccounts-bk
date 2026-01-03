import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';
import { join } from 'path';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';

import { corsOptions } from '../middleware/cors';
import { KeyManager } from '../utils/keys';

export async function bootstrap() {
    await KeyManager.init();

    // [Security] Secret Management Check
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !process.env.COOKIE_SECRET) {
        throw new Error('FATAL: COOKIE_SECRET must be defined in production environment.');
    }

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    );

    // [Security] Helmet for Security Headers
    await app.register(helmet as any);

    await app.register(cookie, {
        secret: process.env.COOKIE_SECRET || 'my-secret-cookie-key', // for signing cookies
    });

    // Register Multipart
    await app.register(multipart as any, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    });

    // [Scalability] Conditional Static Files
    // In production, files should be served via CDN/Object Storage
    if (!isProduction) {
        await app.register(fastifyStatic as any, {
            root: join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
            decorateReply: false,
        });
    }

    // Enable CORS
    app.enableCors(corsOptions);

    // [Security] Validation Strictness
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true, // Prevent Mass Assignment
    }));

    // Global Prefix for API
    app.setGlobalPrefix('api/v1', {
        exclude: ['jwks', '.well-known/openid-configuration', 'metrics'],
    });

    // Filter Edge Guards (IP/API Key) manually to avoid regex routing issues
    const logger = new Logger('Bootstrap');

    // DEBUG: Print DB URL info
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    // Mask password
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    logger.log(`Using Database: ${maskedUrl}`);

    // Middleware is now registered in AppModule

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}
