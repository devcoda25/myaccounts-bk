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
    // [OIDC Fortress] Persistent OIDC Stability Hook (Surgical Alignment Phase 14)
    fastify.addHook('onRequest', async (req, res) => {
        if (req.url.startsWith('/oidc')) {
            // [Fix] Namespace Integrity: Strict Production Issuer
            const isProduction = process.env.NODE_ENV === 'production';
            const envIssuer = process.env.OIDC_ISSUER || (isProduction ? 'https://accounts.evzone.app/oidc' : 'http://localhost:3000/oidc');

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
                if (!target || !target.headers) return;
                target.headers.host = targetHost;
                target.headers['x-forwarded-host'] = targetHost;
                target.headers['x-forwarded-proto'] = targetProto;
                // [Phase 14] Restore X-Forwarded-Prefix. 
                // This is used by the provider to generate absolute URLs (like the one in .well-known)
                target.headers['x-forwarded-prefix'] = '/oidc';
                target.headers['x-forwarded-port'] = (targetProto === 'https') ? '443' : (issuerUrl.port || '80');

                if (targetProto === 'https') {
                    target.headers['x-forwarded-proto'] = 'https';
                }

                // [Fix] Expose Location header so fetch code can read the redirect target
                target.headers['access-control-expose-headers'] = 'Location, Set-Cookie';
            };

            // [Surgical Alignment] Wrap res.raw to fix redirects and cookie paths
            const originalSetHeader = res.raw.setHeader.bind(res.raw);
            res.raw.setHeader = (name: string, value: any) => {
                const lowerName = name.toLowerCase();

                // [Phase 14] Surgical Location Alignment
                // We MUST prepend /oidc to BACKEND redirects (resumption, auth codes)
                // but we MUST NOT prepend it to FRONTEND redirects (sign-in, consent pages).
                if (lowerName === 'location' && typeof value === 'string') {
                    const prefix = '/oidc';

                    // 1. Is it a relative redirect?
                    if (value.startsWith('/') && !value.startsWith(`${prefix}/`)) {
                        // 2. Is it a frontend route? (Leave these alone!)
                        const isFrontend = value.startsWith('/auth/sign-in') || value.startsWith('/auth/consent');

                        // 3. If not frontend, it's likely a backend OIDC path (e.g. /auth/UID, /interaction/UID)
                        if (!isFrontend) {
                            const originalValue = value;
                            value = `${prefix}${value}`;
                            console.log(`[OIDC SURGICAL] HIJACKED BACKEND REDIRECT: ${originalValue} -> ${value}`);
                        } else {
                            console.log(`[OIDC SURGICAL] BYPASSED FRONTEND REDIRECT: ${value}`);
                        }
                    }
                    // 4. Absolute Redirects for our domain that are missing the prefix
                    else if (value.includes(targetHost) && !value.includes(`${targetHost}${prefix}/`)) {
                        const isFrontend = value.includes('/auth/sign-in') || value.includes('/auth/consent');
                        if (!isFrontend) {
                            const originalValue = value;
                            value = value.replace(`${targetHost}/`, `${targetHost}${prefix}/`);
                            console.log(`[OIDC SURGICAL] HIJACKED ABSOLUTE REDIRECT: ${originalValue} -> ${value}`);
                        }
                    }
                }

                if (lowerName === 'set-cookie') {
                    // Force ALL cookies to Path=/ to ensure cross-namespace visibility
                    let correctedValue = value;
                    const pathRegex = /path=[^;]*/gi;
                    if (Array.isArray(value)) {
                        correctedValue = value.map(c => c.replace(pathRegex, 'Path=/'));
                    } else if (typeof value === 'string') {
                        correctedValue = value.replace(pathRegex, 'Path=/');
                    }
                    return originalSetHeader(name, correctedValue);
                }
                return originalSetHeader(name, value);
            };

            forceHeaders(req);
            if (req.raw) {
                forceHeaders(req.raw);
            }

            // [Phase 14] Restore Prefix Stripping
            // Required because the provider's router does not match paths containing the prefix.
            if (req.url.startsWith('/oidc')) {
                const newUrl = req.url.replace('/oidc', '') || '/';
                if (req.raw) req.raw.url = newUrl;
            }

            // Let NestJS handle OIDC interaction routes
            if (req.url.startsWith('/oidc/interaction')) {
                return;
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
            if (status >= 300 && status < 400) {
                console.log(`[OIDC TRACE] REDIRECT ${req.method} ${req.url} -> ${location} (Status: ${status})`);
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
    if (!isProduction) {
        await app.register(fastifyStatic, {
            root: join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
            decorateReply: false,
            setHeaders: (res) => {
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Content-Disposition', 'attachment');
            }
        });
    }

    // [Security] Validation Strictness
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
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
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: ${await app.getUrl()}`);
}
