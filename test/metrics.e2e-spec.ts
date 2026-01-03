import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module'; // Import real AppModule to test real integration
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';

describe('Prometheus Metrics (e2e)', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );
        // Register Cookie Plugin as AppModule needs it
        await app.register(cookie as any, {
            secret: 'test-secret',
        });

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/metrics (GET) - Should return default metrics', () => {
        return request(app.getHttpServer())
            .get('/metrics')
            .expect(200)
            .expect((res) => {
                expect(res.text).toContain('process_cpu_user_seconds_total');
                expect(res.text).toContain('nodejs_version_info');
            });
    });
});
