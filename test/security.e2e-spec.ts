import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SecurityService } from '../services/security/security.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('SecurityController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockSecurityService = {
        getOverview: jest.fn(),
        getActivity: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(SecurityService)
            .useValue(mockSecurityService)
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { sub: 'user-123', role: 'USER' };
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

    it('/api/v1/security/overview (GET) - Get Overview', () => {
        mockSecurityService.getOverview.mockResolvedValue({ mfaEnabled: true });

        return request(app.getHttpServer())
            .get('/api/v1/security/overview')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('mfaEnabled', true);
            });
    });

    it('/api/v1/security/activity (GET) - Get Activity', () => {
        mockSecurityService.getActivity.mockResolvedValue([{ id: 'log-1', event: 'login' }]);

        return request(app.getHttpServer())
            .get('/api/v1/security/activity')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([{ id: 'log-1', event: 'login' }]);
            });
    });
});
