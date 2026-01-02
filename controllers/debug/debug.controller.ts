import { Controller, Get, Post, Res } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import { FastifyReply } from 'fastify';
import * as argon2 from 'argon2';

@Controller('debug')
export class DebugController {
    constructor(private prisma: PrismaService) { }

    @Get()
    async getDebugPanel(@Res() res: FastifyReply) {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>MyAccounts Debug Panel</title>
            <style>
                body { font-family: sans-serif; padding: 40px; background: #f4f7f6; }
                .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
                h1 { color: #2c3e50; }
                button { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
                button:hover { background: #2980b9; }
                pre { background: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <h1>MyAccounts Identity Debug Panel</h1>
            
            <div class="card">
                <h2>1. Setup Test Environment</h2>
                <p>Click to seed a test user and a test OIDC client (clientId: 'test-app').</p>
                <button onclick="seed()">Seed Database</button>
                <div id="seed-result"></div>
            </div>

            <div class="card">
                <h2>2. Verify OIDC Discovery</h2>
                <p>Ensure the standards-compliant discovery document is live.</p>
                <button onclick="window.open('/.well-known/openid-configuration', '_blank')">Open Discovery</button>
                <button onclick="window.open('/jwks', '_blank')">Open JWKS</button>
            </div>

            <div class="card">
                <h2>3. Test Auth Endpoints</h2>
                <p>Check if specific API routes are responding.</p>
                <button onclick="testApi('/api/v1/auth/login', {identifier: 'admin@evzone.com', password: 'superadmin-secure-pw'})">Test Admin Login (admin@evzone.com)</button>
                <button onclick="testApi('/api/v1/auth/login', {identifier: 'test@example.com', password: 'password123'})">Test User Login (test@example.com)</button>
                <button onclick="testApi('/api/v1/auth/login', {})">Test Validation (Empty Body)</button>
                <pre id="api-result">Click a button to test...</pre>
            </div>

            <script>
                async function seed() {
                    const res = await fetch('/api/v1/debug/seed', { method: 'POST' });
                    const data = await res.json();
                    document.getElementById('seed-result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                }

                async function testApi(path, payload) {
                    try {
                        const res = await fetch(path, { 
                            method: 'POST', 
                            headers: {'Content-Type': 'application/json'}, 
                            body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        document.getElementById('api-result').innerText = JSON.stringify(data, null, 2);
                    } catch (e) {
                        document.getElementById('api-result').innerText = 'Error: ' + e;
                    }
                }
            </script>
        </body>
        </html>
        `;
        res.type('text/html').send(html);
    }

    @Post('seed')
    async seedData() {
        // 1. Create Test OIDC Client
        const client = await this.prisma.oAuthClient.upsert({
            where: { clientId: 'test-app' },
            create: {
                clientId: 'test-app',
                name: 'Developer Test App',
                redirectUris: ['http://localhost:3001/callback'],
                isFirstParty: true
            },
            update: {}
        });

        // 2. Create Super Admin User
        const adminPasswordHash = await argon2.hash('superadmin-secure-pw');
        const adminUser = await this.prisma.user.upsert({
            where: { email: 'admin@evzone.com' },
            create: {
                email: 'admin@evzone.com',
                firstName: 'Super',
                otherNames: 'Admin',
                emailVerified: true,
                passwordHash: adminPasswordHash,
                role: 'SUPER_ADMIN'
            },
            update: {
                role: 'SUPER_ADMIN'
            }
        });

        // 3. Create Standard Test User
        const testPasswordHash = await argon2.hash('password123');
        const testUser = await this.prisma.user.upsert({
            where: { email: 'test@example.com' },
            create: {
                email: 'test@example.com',
                firstName: 'Test',
                otherNames: 'User',
                emailVerified: true,
                passwordHash: testPasswordHash,
                role: 'USER'
            },
            update: {}
        });

        return {
            success: true,
            message: 'Database seeded with Super Admin and Test User',
            data: {
                admin: adminUser.email,
                testUser: testUser.email,
                clientId: client.clientId
            }
        };
    }
}
