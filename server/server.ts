import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../app.module';
import { join } from 'path';
import { ServerResponse } from 'http';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';


import middie from '@fastify/middie';
import { OIDC_PROVIDER } from '../modules/auth/oidc.constants';
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
        new FastifyAdapter({ trustProxy: true }), // [Security] Rule F: Trust Proxy (e.g. AWS/Nginx)
        { logger: ['error', 'warn'] } // [Cleanup] Reduce log noise
    );


    // Enable CORS (Fastify Plugin to cover all routes including middleware)
    await app.register(cors, {
        origin: (origin: string, cb: (err: Error | null, allow: boolean) => void) => {
            const config = validateEnv(process.env);
            const allowed = [
                ...config.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
                'https://accounts.evzone.app',
                'https://api.evzone.app'
            ];
            // Strict logic: Only production requires origin match. Dev allows strictness relaxation IF strictly coded.
            const isAllowed = !origin || allowed.includes(origin) || config.NODE_ENV !== 'production';

            if (isAllowed) {
                cb(null, true);
            } else {
                cb(new Error('Not allowed by CORS'), false);
            }
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id', 'x-api-key'],
    });

    // [OIDC] Enable Express-style middleware (required for oidc-provider)
    const fastify = app.getHttpAdapter().getInstance();
    // Check if 'use' decorator already exists (to avoid FST_ERR_DEC_ALREADY_PRESENT)
    if (!fastify.use) {
        await app.register(middie);
    }

    // [OIDC] Mount Provider (Exclude /api to prevent hijacking)
    const oidc = app.get(OIDC_PROVIDER); // OIDC_PROVIDER is symbol
    const oidcCallback = oidc.callback();
    fastify.use((req: any, res: any, next: any) => {
        if (req.url.startsWith('/api') || req.url.startsWith('/interaction')) {
            return next();
        }
        return oidcCallback(req, res, next);
    });

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
    await app.register(multipart, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    });

    // [Scalability] Conditional Static Files
    // In production, files should be served via CDN/Object Storage
    if (!isProduction) {
        await app.register(fastifyStatic, {
            root: join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
            decorateReply: false,
            setHeaders: (res) => {
                // [Security] Rule B: Prevent Stored XSS via Uploads
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Content-Disposition', 'attachment');
            }
        });
    }





    // [Security] Validation Strictness
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true, // [Security] Rule C: Prevent Mass Assignment
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));

    // Global Prefix for API
    app.setGlobalPrefix('api/v1', {
        exclude: ['jwks', '.well-known/openid-configuration', 'metrics', 'interaction/(.*)'],
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
    await app.listen(port, '::');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}

// bootstrap(); // Removed to prevent double-execution when imported by main.ts
