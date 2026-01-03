import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppsService } from '../services/apps/apps.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('AppsController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockAppsService = {
        getApps: jest.fn(),
        getPermissions: jest.fn(),
        revokeAccess: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AppsService)
            .useValue(mockAppsService)
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

    it('/api/v1/apps (GET) - Get Apps', () => {
        mockAppsService.getApps.mockResolvedValue([{ clientId: 'app-1', name: 'App 1' }]);

        return request(app.getHttpServer())
            .get('/api/v1/apps')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([{ clientId: 'app-1', name: 'App 1' }]);
            });
    });

    it('/api/v1/apps/:id/revoke (POST) - Revoke Access', () => {
        mockAppsService.revokeAccess.mockResolvedValue({ success: true });

        return request(app.getHttpServer())
            .post('/api/v1/apps/app-1/revoke')
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('success', true);
            });
    });
});
