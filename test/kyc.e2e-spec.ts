import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { KycService } from '../services/kyc/kyc.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('KycController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockKycService = {
        getStatus: jest.fn(),
        submitKyc: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(KycService)
            .useValue(mockKycService)
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

    it('/api/v1/kyc/status (GET) - Get Status', () => {
        mockKycService.getStatus.mockResolvedValue({ status: 'Pending', level: 1 });

        return request(app.getHttpServer())
            .get('/api/v1/kyc/status')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('status', 'Pending');
            });
    });

    it('/api/v1/kyc/submit (POST) - Submit KYC', () => {
        mockKycService.submitKyc.mockResolvedValue({ status: 'In Review' });

        return request(app.getHttpServer())
            .post('/api/v1/kyc/submit')
            .send({ docType: 'National ID', level: 1, files: [] })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('status', 'In Review');
            });
    });
});
