import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
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
import formbody from '@fastify/formbody';
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

    // [Fix] Enable Form Body Parsing (x-www-form-urlencoded) for OIDC interactions
    // await app.register(formbody); // [REMOVED] NestJS registers this automatically, causing FST_ERR_CTP_ALREADY_PRESENT if we do it here.

    // [OIDC] Enable Express-style middleware (required for oidc-provider)
    const fastify = app.getHttpAdapter().getInstance();
    // Check if 'use' decorator already exists (to avoid FST_ERR_DEC_ALREADY_PRESENT)
    if (!fastify.use) {
        await app.register(middie);
    }

    // [OIDC] Mount Provider (Exclude /api to prevent hijacking)
    // [OIDC] Mount Provider on /oidc namespace
    const oidc = app.get(OIDC_PROVIDER); // OIDC_PROVIDER is symbol
    const oidcCallback = oidc.callback();
    // [OIDC Fortress] Persistent OIDC Stability Hook (Atomic Stability Patch)
    fastify.addHook('onRequest', async (req, res) => {
        if (req.url.startsWith('/oidc')) {
            // [Fix] Atomic Host Enforcement: In production, force canonical issuer regardless of .env misconfiguration.
            const isProduction = process.env.NODE_ENV === 'production';
            const canonicalIssuer = 'https://accounts.evzone.app/oidc';
            const envIssuer = process.env.OIDC_ISSUER || canonicalIssuer;

            // If in production and env is pointing to localhost or missing, force canonical.
            const finalIssuer = (isProduction && (envIssuer.includes('localhost') || envIssuer.includes('127.0.0.1')))
                ? canonicalIssuer
                : envIssuer;

            const issuerUrl = new URL(finalIssuer);
            const targetHost = issuerUrl.host;
            const targetProto = issuerUrl.protocol.replace(':', '');
            const issuerPath = issuerUrl.pathname.replace(/\/$/, '');

            // [Fix] Host Enforcement: Immediate 302 redirect to canonical domain if host mismatch occurs.
            const currentHost = req.headers.host;
            if (currentHost && currentHost !== targetHost && currentHost !== '127.0.0.1' && !currentHost.startsWith('127.0.0.1:')) {
                const redirectUrl = `${targetProto}://${targetHost}${req.url}`;
                console.log(`[OIDC FORTRESS] Force Host Redirect: ${currentHost} -> ${redirectUrl}`);
                return res.code(302).redirect(redirectUrl);
            }

            // [Fix] Header & Prefix Spoofing: Required for oidc-provider absolute URL generation.
            const forceHeaders = (target: any) => {
                target.headers.host = targetHost;
                target.headers['x-forwarded-host'] = targetHost;
                target.headers['x-forwarded-proto'] = targetProto;
                target.headers['x-forwarded-prefix'] = issuerPath || '/oidc';
                target.headers['x-forwarded-port'] = (targetProto === 'https') ? '443' : (issuerUrl.port || '80');
            };

            forceHeaders(req);
            if (req.raw) forceHeaders(req.raw);

            // Let NestJS handle OIDC interaction routes
            if (req.url.startsWith('/oidc/interaction')) {
                return; // Proceed to NestJS controllers
            }

            // [Fix] Path Normalization: MUST ONLY mutate req.raw.url. 
            // Fastify's req.url is a read-only getter. Mutating it causes TypeError: Cannot set property url.
            if (issuerPath && req.url.startsWith(issuerPath)) {
                const newUrl = req.url.replace(issuerPath, '') || '/';
                if (req.raw) req.raw.url = newUrl;
            }

            // [Fix] Pass to oidc-provider (Wait for the callback to finish)
            return new Promise<void>((resolve, reject) => {
                oidcCallback(req.raw, res.raw, (err: any) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
    });

    // [Security] Helmet for Security Headers & CSP
    const trustedDomains = (process.env.CSP_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);

    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", ...trustedDomains], // Allow analytics/scripts
                imgSrc: ["'self'", 'data:', 'https:', ...trustedDomains], // Allow CDN images
                connectSrc: ["'self'", ...trustedDomains], // Allow API calls
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
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
        exclude: [
            { path: 'oidc/jwks', method: RequestMethod.GET },
            { path: 'oidc/.well-known/openid-configuration', method: RequestMethod.GET },
            { path: 'oidc/interaction/:uid', method: RequestMethod.ALL },
            { path: 'oidc/(.*)', method: RequestMethod.ALL }
        ],
    });

    const logger = new Logger('Bootstrap');
    logger.log('Bootstrap phase starting...');

    // DEBUG: Print DB URL info
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    // Mask password
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
    logger.log(`Using Database: ${maskedUrl}`);

    const port = process.env.PORT || 3000;
    const DEPLOY_ID = 'ATOMIC_STABILITY_V3_FINAL';
    logger.log(`[BOOTSTRAP] Deployment Fingerprint: ${DEPLOY_ID}`);
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}

// bootstrap(); // Removed to prevent double-execution when imported by main.ts
