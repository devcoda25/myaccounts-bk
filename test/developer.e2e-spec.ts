import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DeveloperService } from '../services/developer/developer.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('DeveloperController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockDeveloperService = {
        getApiKeys: jest.fn(),
        createApiKey: jest.fn(),
        revokeApiKey: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(DeveloperService)
            .useValue(mockDeveloperService)
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { sub: 'dev-1', role: 'USER' };
                    return true;
                }
            })
            .compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );
        await app.register(cookie as any, { secret: 'test-secret' });
        app.setGlobalPrefix('api/v1');

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/v1/developer/api-keys (GET) - Get Keys', () => {
        mockDeveloperService.getApiKeys.mockResolvedValue([{ id: 'key-1', name: 'My Key' }]);

        return request(app.getHttpServer())
            .get('/api/v1/developer/api-keys')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([{ id: 'key-1', name: 'My Key' }]);
            });
    });

    it('/api/v1/developer/api-keys (POST) - Create Key', () => {
        mockDeveloperService.createApiKey.mockResolvedValue({ key: 'sk_test_123', id: 'key-2' });

        return request(app.getHttpServer())
            .post('/api/v1/developer/api-keys')
            .send({ name: 'New Key', scopes: ['read'] })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('key', 'sk_test_123');
            });
    });
});
