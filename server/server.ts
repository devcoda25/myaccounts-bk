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

import { corsOptions } from '../middleware/cors';
import { KeyManager } from '../utils/keys';
import { EdgeGuardMiddleware } from '../middleware/edge-guard.middleware';

export async function bootstrap() {
    await KeyManager.init();

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    );

    await app.register(cookie, {
        secret: process.env.COOKIE_SECRET || 'my-secret-cookie-key', // for signing cookies
    });

    // Register Multipart
    await app.register(multipart as any, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    });

    // Register Static
    await app.register(fastifyStatic as any, {
        root: join(process.cwd(), 'uploads'),
        prefix: '/uploads/',
        decorateReply: false,
    });

    // Enable CORS
    app.enableCors(corsOptions);

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    // Global Prefix for API
    app.setGlobalPrefix('api/v1', {
        exclude: ['jwks', '.well-known/openid-configuration'],
    });

    // Filter Edge Guards (IP/API Key) manually to avoid regex routing issues
    const logger = new Logger('Bootstrap');

    // DEBUG: Print DB URL info
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    // Mask password
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    logger.log(`Using Database: ${maskedUrl}`);
    const edgeGuard = new EdgeGuardMiddleware();
    app.use((req, res, next) => edgeGuard.use(req, res, next));

    await app.listen(3000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}
