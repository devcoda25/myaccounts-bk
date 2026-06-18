import { Test, TestingModule } from '@nestjs/testing';
import { UserQueryService } from './user-query.service';
import { UserFindRepository } from '../../repos/users/user-find.repository';

describe('UserQueryService', () => {
    let service: UserQueryService;
    let mockRepo: any;

    beforeEach(async () => {
        mockRepo = {
            findOneById: jest.fn().mockResolvedValue({
                id: 'test-id',
                passwordHash: 'hash',
                twoFactorSecret: 'secret',
                recoveryCodes: [],
            }),
            findOneByEmail: jest.fn(),
            findOneByIdentifier: jest.fn(),
            findAll: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserQueryService,
                { provide: UserFindRepository, useValue: mockRepo },
            ],
        }).compile();

        service = module.get<UserQueryService>(UserQueryService);
    });

    it('should respect includeAuditLogs: false when fullProfile is true', async () => {
        await service.findById('test-id', { fullProfile: true, includeAuditLogs: false });

        expect(mockRepo.findOneById).toHaveBeenCalledWith(
            'test-id',
            expect.objectContaining({
                includeAuditLogs: false,
            }),
        );
    });

    it('should respect includeSessions: false when fullProfile is true', async () => {
        await service.findById('test-id', { fullProfile: true, includeSessions: false });

        expect(mockRepo.findOneById).toHaveBeenCalledWith(
            'test-id',
            expect.objectContaining({
                includeSessions: false,
            }),
        );
    });

    it('should default to including logs/sessions when fullProfile is true', async () => {
        await service.findById('test-id', { fullProfile: true });

        expect(mockRepo.findOneById).toHaveBeenCalledWith(
            'test-id',
            expect.objectContaining({
                includeAuditLogs: true,
                includeSessions: true,
            }),
        );
    });
});
