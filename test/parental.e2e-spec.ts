import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ParentalService } from '../services/parental/parental.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import cookie from '@fastify/cookie';

describe('ParentalController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockParentalService = {
        getChildren: jest.fn(),
        createChild: jest.fn(),
        getHousehold: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(ParentalService)
            .useValue(mockParentalService)
            .overrideGuard(AuthGuard)
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = { sub: 'parent-1', role: 'USER' };
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

    it('/api/v1/parental/children (GET) - Get Children', () => {
        mockParentalService.getChildren.mockResolvedValue([{ id: 'child-1', name: 'Kid' }]);

        return request(app.getHttpServer())
            .get('/api/v1/parental/children')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual([{ id: 'child-1', name: 'Kid' }]);
            });
    });

    it('/api/v1/parental/children/create (POST) - Create Child', () => {
        mockParentalService.createChild.mockResolvedValue({ id: 'child-2', name: 'New Kid' });

        return request(app.getHttpServer())
            .post('/api/v1/parental/children/create')
            .send({ name: 'New Kid', dob: '2015-01-01' })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('name', 'New Kid');
            });
    });
});
