import 'reflect-metadata';
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

import { validateEnv } from '../utils/env.validation';
import { FastifyRegisterOptions } from 'fastify';

export async function bootstrap() {
    await KeyManager.init();

    // [Security] Strict Env Validation & Typed Config
    const config = validateEnv(process.env);
    const isProduction = config.NODE_ENV === 'production';

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    );

    // [Security] Helmet for Security Headers & CSP
    // Typed registration without 'any'
    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"], // No unsafe-inline
                objectSrc: ["'none'"],
            },
        },
    });

    await app.register(cookie, {
        secret: config.COOKIE_SECRET, // Typed from Zod
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
        // forbidNonWhitelisted: true, // Temporarily disabled to debug transformation
        transformOptions: {
            enableImplicitConversion: true,
        },
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
