import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UserManagementService } from '../services/users/user-management.service';
import { UserQueryService } from '../services/users/user-query.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import cookie from '@fastify/cookie';

describe('UsersController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockUserManagementService = {
        updateProfile: jest.fn(),
        updatePreferences: jest.fn(),
        uploadAvatar: jest.fn(),
    };

    const mockUserQueryService = {
        findById: jest.fn(),
        findAll: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(UserManagementService)
            .useValue(mockUserManagementService)
            .overrideProvider(UserQueryService)
            .useValue(mockUserQueryService)
            // Mock AuthGuard to bypass actual JWT check and inject a fake user
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { sub: 'user-123', role: 'USER' }; // Fake User
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
        // Register Cookie Plugin
        await app.register(cookie as any, {
            secret: 'test-secret',
        });

        app.setGlobalPrefix('api/v1');
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/v1/users/me (GET) - Success', () => {
        mockUserQueryService.findById.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

        return request(app.getHttpServer())
            .get('/api/v1/users/me')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('id', 'user-123');
            });
    });

    it('/api/v1/users/me (PATCH) - Update Profile', () => {
        mockUserManagementService.updateProfile.mockResolvedValue({ id: 'user-123', firstName: 'Updated' });

        return request(app.getHttpServer())
            .patch('/api/v1/users/me')
            .send({ firstName: 'Updated' })
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('firstName', 'Updated');
            });
    });
});
