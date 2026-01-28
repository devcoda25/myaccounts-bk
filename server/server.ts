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
        // [Fix] Ensure Location and Set-Cookie are exposed to the frontend for OIDC resumption and debugging
        exposedHeaders: ['Location', 'Set-Cookie'],
    });

    // [OIDC] Enable Express-style middleware (required for oidc-provider)
    const fastify = app.getHttpAdapter().getInstance();
    if (!fastify.use) {
        await app.register(middie);
    }

    // [OIDC] Mount Provider on /oidc namespace
    const oidc = app.get(OIDC_PROVIDER);
    const oidcCallback = oidc.callback();

    // [OIDC Fortress] Persistent OIDC Stability Hook (Phase 18 Holistic Fix)
    fastify.addHook('onRequest', async (req, res) => {
        if (req.url.startsWith('/oidc')) {
            const isProduction = process.env.NODE_ENV === 'production';
            const envIssuer = process.env.OIDC_ISSUER || (isProduction ? 'https://accounts.evzone.app/oidc' : 'http://localhost:3000/oidc');

            const issuerUrl = new URL(envIssuer);
            const targetHost = issuerUrl.host;
            const targetProto = issuerUrl.protocol.replace(':', '');

            // [Fix] Host Enforcement
            const currentHost = req.headers.host;
            if (currentHost && currentHost !== targetHost && currentHost !== '127.0.0.1' && !currentHost.startsWith('127.0.0.1:')) {
                return res.code(302).redirect(`${targetProto}://${targetHost}${req.url}`);
            }

            // [Fix] Header Spoofing
            const forceHeaders = (target: any) => {
                if (!target || !target.headers) return;
                target.headers['host'] = targetHost;
                target.headers['x-forwarded-host'] = targetHost;
                target.headers['x-forwarded-proto'] = targetProto;
                target.headers['x-forwarded-prefix'] = '/oidc';
                target.headers['x-forwarded-port'] = (targetProto === 'https') ? '443' : (issuerUrl.port || '80');

                if (targetProto === 'https') {
                    target.headers['x-forwarded-proto'] = 'https';
                }
            };

            // [Surgical Alignment] Wrap res.raw to fix redirects and cookie paths
            const originalSetHeader = res.raw.setHeader.bind(res.raw);
            res.raw.setHeader = (name: string, value: any) => {
                const lowerName = name.toLowerCase();

                // [Phase 18] Defensive Location Alignment
                // We MUST prepend /oidc to BACKEND redirects (resumption, auth codes)
                // but we MUST NOT prepend it to FRONTEND routes or CALLBACKS.
                if (lowerName === 'location' && typeof value === 'string') {
                    const prefix = '/oidc';

                    // Logic: If it's a frontend route or an OIDC callback, DO NOT HIJACK.
                    // This prevents the loop where /auth/callback gets turned into /oidc/auth/callback
                    const isFrontendRoute = value.includes('/auth/sign-in') || value.includes('/auth/consent');
                    const isCallback = value.includes('/auth/callback');
                    const isAlreadyPrefixed = value.startsWith(prefix) || value.includes(`${targetHost}${prefix}`);

                    if (!isFrontendRoute && !isCallback && !isAlreadyPrefixed) {
                        // Hijack relative redirects
                        if (value.startsWith('/') && !value.startsWith(`${prefix}/`)) {
                            const originalValue = value;
                            value = `${prefix}${value}`;
                            console.log(`[OIDC PHASE 18] Hijacked Relative: ${originalValue} -> ${value}`);
                        }
                        // Hijack absolute redirects for our domain
                        else if (value.includes(targetHost) && !value.includes(`${targetHost}${prefix}/`)) {
                            const originalValue = value;
                            value = value.replace(`${targetHost}/`, `${targetHost}${prefix}/`);
                            console.log(`[OIDC PHASE 18] Hijacked Absolute: ${originalValue} -> ${value}`);
                        }
                    } else {
                        console.log(`[OIDC PHASE 18] Safe Bypass: ${value}`);
                    }
                }

                if (lowerName === 'set-cookie') {
                    let correctedValue = value;
                    const pathRegex = /path=[^;]*/gi;
                    if (Array.isArray(value)) {
                        correctedValue = value.map(c => c.replace(pathRegex, 'Path=/'));
                    } else if (typeof value === 'string') {
                        correctedValue = value.replace(pathRegex, 'Path=/');
                    }
                    console.log(`[OIDC MEGA-TRACE] OUTGOING Set-Cookie:`, correctedValue);
                    return originalSetHeader(name, correctedValue);
                }
                return originalSetHeader(name, value);
            };

            forceHeaders(req);
            if (req.raw) {
                forceHeaders(req.raw);
            }

            // [OIDC MEGA-TRACE] Incoming Context
            console.log(`[OIDC MEGA-TRACE] INCOMING Cookie (${req.url}):`, req.raw.headers.cookie || 'NONE');

            // [Phase 15] Surgical Dispatch Logic
            const originalUrl = req.url;

            // 1. Interaction Routes -> hand back to NestJS
            if (originalUrl.startsWith('/oidc/interaction')) {
                console.log(`[OIDC] Dispatching Interaction to NestJS: ${originalUrl}`);
                return;
            }

            // 2. Protocol Routes -> Strip prefix for Provider
            const strippedUrl = originalUrl.replace('/oidc', '') || '/';
            if (req.raw) {
                req.raw.url = strippedUrl;
            }

            console.log(`[OIDC] Dispatching Protocol Route to Provider: ${originalUrl} -> ${strippedUrl}`);

            return new Promise<void>((resolve, reject) => {
                oidcCallback(req.raw, res.raw, (err: any) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
    });

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

    // Helmet configuration
    const trustedDomains = (process.env.CSP_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean);
    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", ...trustedDomains],
                imgSrc: ["'self'", 'data:', 'https:', ...trustedDomains],
                connectSrc: ["'self'", ...trustedDomains],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
    });

    await app.register(cookie, {
        secret: config.COOKIE_SECRET,
    });

    await app.register(multipart, {
        limits: { fileSize: 5 * 1024 * 1024 },
    });

    if (!isProduction) {
        await app.register(fastifyStatic, {
            root: join(process.cwd(), 'uploads'),
            prefix: '/uploads/',
            decorateReply: false,
        });
    }

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));

    app.setGlobalPrefix('api/v1', {
        exclude: [
            { path: 'oidc/jwks', method: RequestMethod.GET },
            { path: 'oidc/.well-known/openid-configuration', method: RequestMethod.GET },
            { path: 'oidc/interaction/:uid', method: RequestMethod.ALL },
            { path: 'oidc/(.*)', method: RequestMethod.ALL }
        ],
    });

    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}
