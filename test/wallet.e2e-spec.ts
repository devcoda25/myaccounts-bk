import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { WalletCoreService } from '../services/wallet/wallet-core.service';
import { WalletTransactionService } from '../services/wallet/wallet-transaction.service';
import { AuthGuard } from '../common/guards/auth.guard';
import cookie from '@fastify/cookie';

describe('WalletController (e2e)', () => {
    let app: NestFastifyApplication;

    const mockWalletCore = {
        getWallet: jest.fn(),
        getStats: jest.fn(),
    };

    const mockWalletTx = {
        getHistory: jest.fn(),
        deposit: jest.fn(),
        withdraw: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(WalletCoreService)
            .useValue(mockWalletCore)
            .overrideProvider(WalletTransactionService)
            .useValue(mockWalletTx)
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

    it('/api/v1/wallets/me (GET) - Get Wallet', () => {
        mockWalletCore.getWallet.mockResolvedValue({ id: 'wallet-1', balance: 100.00 });

        return request(app.getHttpServer())
            .get('/api/v1/wallets/me')
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('balance', 100.00);
            });
    });

    it('/api/v1/wallets/me/add-funds (POST) - Deposit', () => {
        mockWalletTx.deposit.mockResolvedValue({ id: 'tx-1', status: 'completed' });

        return request(app.getHttpServer())
            .post('/api/v1/wallets/me/add-funds')
            .send({ amount: 50.00 })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('status', 'completed');
            });
    });
});
