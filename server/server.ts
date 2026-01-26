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
                // [Optimization] Return false instead of throwing to prevent 500 error on preflight
                cb(null, false);
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
            // [Fix] Namespace Integrity: Strict Production Issuer
            const isProduction = process.env.NODE_ENV === 'production';
            const envIssuer = isProduction ? 'https://accounts.evzone.app/oidc' : (process.env.OIDC_ISSUER || 'http://localhost:3000/oidc');

            const issuerUrl = new URL(envIssuer);
            const targetHost = issuerUrl.host;
            const targetProto = issuerUrl.protocol.replace(':', '');

            // [Fix] Host Enforcement: Immediate 302 redirect.
            const currentHost = req.headers.host;
            if (currentHost && currentHost !== targetHost && currentHost !== '127.0.0.1' && !currentHost.startsWith('127.0.0.1:')) {
                return res.code(302).redirect(`${targetProto}://${targetHost}${req.url}`);
            }

            // [Fix] Header Spoofing: Required for internal absolute URL generation.
            const forceHeaders = (target: any) => {
                target.headers.host = targetHost;
                target.headers['x-forwarded-host'] = targetHost;
                target.headers['x-forwarded-proto'] = targetProto;
                // Important: Signal prefix explicitly even if path is preserved
                target.headers['x-forwarded-prefix'] = '/oidc';
                target.headers['x-forwarded-port'] = (targetProto === 'https') ? '443' : (issuerUrl.port || '80');
            };

            // [DEBUG] Log incoming OIDC request
            console.log(`[OIDC DEBUG] ${req.method} ${req.url} - Cookies: ${req.headers.cookie || 'NONE'}`);

            forceHeaders(req);
            if (req.raw) forceHeaders(req.raw);

            // [Security] Force Purge Stale OIDC cookies from all possible domains (host and wildcard)
            const staleTokens = ['_interaction', '_session', '_resume'];
            const domains = [undefined, '.evzone.app'];

            staleTokens.forEach(name => {
                const sigName = `${name}.sig`;
                domains.forEach(domain => {
                    const domainAttr = domain ? `; Domain=${domain}` : '';
                    const baseCookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax${domainAttr}`;
                    const sigCookie = `${sigName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax${domainAttr}`;

                    // Use res.raw.setHeader to send multiple Set-Cookie headers correctly in Node.js/Fastify
                    const current = res.raw.getHeader('Set-Cookie');
                    const existing = Array.isArray(current) ? current : (current ? [String(current)] : []);
                    res.raw.setHeader('Set-Cookie', [...existing, baseCookie, sigCookie]);
                });
            });

            // Let NestJS handle OIDC interaction routes
            if (req.url.startsWith('/oidc/interaction')) {
                return;
            }

            // [Fix] Namespace Integrity: Correct Internal Routing
            // oidc-provider's internal router expects paths relative to its mount point.
            // We MUST strip '/oidc' from the URL for the router to match.
            // However, we MUST set 'x-forwarded-prefix' so it knows how to generate external URLs.

            // Safe Stripping: Only mutate req.raw.url (Node.js request), never Fastify's req.url (read-only).
            if (req.url.startsWith('/oidc')) {
                const newUrl = req.url.replace('/oidc', '') || '/';
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

    // [DEBUG] Intensive OIDC Traceability Hook
    fastify.addHook('onSend', async (req, reply, payload) => {
        const isOidc = req.url.startsWith('/oidc') || req.url.startsWith('/auth');
        if (isOidc) {
            const status = reply.statusCode;
            const location = reply.getHeader('location');
            const setCookie = reply.getHeader('set-cookie');

            if (status >= 300 && status < 400) {
                console.log(`[OIDC TRACE] REDIRECT ${req.method} ${req.url} -> ${location} (Status: ${status})`);
            } else if (status >= 400) {
                console.warn(`[OIDC TRACE] ERROR ${req.method} ${req.url} -> Status: ${status}`);
            }

            if (setCookie) {
                const cookies = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
                cookies.forEach(c => console.log(`[OIDC TRACE] Response SET-COOKIE: ${c.split(';')[0]}...`));
            }
        }
        return payload;
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
    const DEPLOY_ID = 'V4_COOKIE_FIX_ATOMIC';
    logger.log(`[BOOTSTRAP] Deployment Fingerprint: ${DEPLOY_ID}`);
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}

// bootstrap(); // Removed to prevent double-execution when imported by main.ts
