import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { LoginService } from '../services/auth/login.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('LoginController (e2e)', () => {
    let app: NestFastifyApplication;
    let loginService = {
        validateUser: jest.fn(),
        generateSessionToken: jest.fn(),
        refreshSession: jest.fn(),
        validatePassword: jest.fn()
    };

    beforeAll(async () => {
        const moduleFixture = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(LoginService)
            .useValue(loginService)
            .compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        // Register Cookie Plugin
        await app.register(cookie as any, {
            secret: 'test-secret',
        });

        // Mimic main.ts setup
        app.setGlobalPrefix('api/v1');

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/v1/auth/login (POST) - Success', () => {
        loginService.validateUser.mockResolvedValue({ id: '123', email: 'test@example.com', role: 'USER' });
        loginService.generateSessionToken.mockResolvedValue({
            access_token: 'fake_access_token',
            refresh_token: 'fake_refresh_token',
            expires_in: 900
        });

        return request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ identifier: 'test@example.com', password: 'password' })
            .expect(201)
            .catch((err) => {
                console.log('Test Failed. Response:', err.response?.body);
                console.log('Status:', err.response?.status);
                throw err;
            })
            .then((res) => {
                if (res) {
                    expect(res.body).toHaveProperty('access_token', 'fake_access_token');
                    // Check cookies if supertest supports it with fastify
                }
            });
    });

    it('/api/v1/auth/login (POST) - Unauthorized', () => {
        loginService.validateUser.mockResolvedValue(null);

        return request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ identifier: 'wrong', password: 'wrong' })
            .expect(401);
    });
});
