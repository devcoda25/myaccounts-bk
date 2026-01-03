import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AdminService } from '../services/admin/admin.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import cookie from '@fastify/cookie';

describe('AdminController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockAdminService = {
        getDashboardStats: jest.fn(),
        getAuditLogs: jest.fn(),
        getOrgs: jest.fn(),
        getWallets: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AdminService)
            .useValue(mockAdminService)
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { sub: 'admin-1', role: 'SUPER_ADMIN' };
                    return true;
                }
            })
            .overrideGuard(RolesGuard)
            .useValue({
                canActivate: () => true
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

    it('/api/v1/admin/stats (GET) - Dashboard Stats', () => {
        mockAdminService.getDashboardStats.mockResolvedValue({ users: 100, active: 50 });

        return request(app.getHttpServer())
            .get('/api/v1/admin/stats')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('users', 100);
            });
    });

    it('/api/v1/admin/audit-logs (GET) - Audit Logs', () => {
        mockAdminService.getAuditLogs.mockResolvedValue({ data: [], total: 0 });

        return request(app.getHttpServer())
            .get('/api/v1/admin/audit-logs')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('data');
            });
    });
});
