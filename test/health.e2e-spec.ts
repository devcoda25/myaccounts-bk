import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../prisma-lib/prisma.service';
import cookie from '@fastify/cookie';

describe('HealthController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockPrismaService = {
        $queryRaw: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(mockPrismaService)
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

    it('/api/v1/health (GET) - Operational', () => {
        mockPrismaService.$queryRaw.mockResolvedValue([1]);

        return request(app.getHttpServer())
            .get('/api/v1/health')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('status', 'Operational');
                expect(res.body.services).toHaveLength(4);
            });
    });

    it('/api/v1/health (GET) - Degraded', () => {
        mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Down'));

        return request(app.getHttpServer())
            .get('/api/v1/health')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('status', 'Degraded');
            });
    });
});
