import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { OrganizationService } from '../services/organizations/organization.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('OrganizationController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockOrgService = {
        getUserOrgs: jest.fn(),
        createOrg: jest.fn(),
        getOrg: jest.fn(),
        updateSettings: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(OrganizationService)
            .useValue(mockOrgService)
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

    it('/api/v1/orgs (GET) - List Orgs', () => {
        mockOrgService.getUserOrgs.mockResolvedValue([{ id: 'org-1', name: 'Test Org' }]);

        return request(app.getHttpServer())
            .get('/api/v1/orgs')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([{ id: 'org-1', name: 'Test Org' }]);
            });
    });

    it('/api/v1/orgs (POST) - Create Org', () => {
        mockOrgService.createOrg.mockResolvedValue({ id: 'org-1', name: 'New Org' });

        return request(app.getHttpServer())
            .post('/api/v1/orgs')
            .send({ name: 'New Org', country: 'US' })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('name', 'New Org');
            });
    });
});
