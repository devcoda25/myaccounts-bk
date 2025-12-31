import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';

import { KeyManager } from './utils/keys';

async function bootstrap() {
    await KeyManager.init();

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter()
    );

    // Register Multipart
    await app.register(multipart as any, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    });

    // Register Static
    await app.register(fastifyStatic as any, {
        root: join(__dirname, '..', 'uploads'),
        prefix: '/uploads/',
        decorateReply: false, // Avoid conflict if registered elsewhere
    });

    // Enable CORS
    app.enableCors();

    await app.listen(3000, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
