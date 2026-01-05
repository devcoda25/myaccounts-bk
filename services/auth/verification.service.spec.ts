import { Test, TestingModule } from '@nestjs/testing';
import { VerificationService } from './verification.service';
import { VerificationRepository } from '../../repos/users/verification.repository';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserUpdateRepository } from '../../repos/users/user-update.repository';
import { SmsService } from '../../services/notifications/sms.service';
import { EmailService } from '../../services/notifications/email.service';
import { WhatsappService } from '../../services/notifications/whatsapp.service';
import { UnauthorizedException } from '@nestjs/common';

// Mocks
const mockVerificationRepo = {
    saveVerification: jest.fn(),
    findVerification: jest.fn(),
    findActiveRequest: jest.fn(),
    incrementAttempts: jest.fn(),
    deleteVerification: jest.fn()
};

describe('VerificationService', () => {
    let service: VerificationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationService,
                { provide: VerificationRepository, useValue: mockVerificationRepo },
                { provide: UserFindRepository, useValue: {} },
                { provide: UserUpdateRepository, useValue: {} },
                { provide: SmsService, useValue: { sendSms: jest.fn() } },
                { provide: EmailService, useValue: { sendEmail: jest.fn() } },
                { provide: WhatsappService, useValue: {} },
            ],
        }).compile();

        service = module.get<VerificationService>(VerificationService);
        jest.clearAllMocks();
    });

    it('should generate a 6-digit OTP using crypto logic', async () => {
        // We can't easily mock crypto.randomInt but we can check the output format
        await service.requestVerification('test@example.com', 'EMAIL_VERIFY');

        expect(mockVerificationRepo.saveVerification).toHaveBeenCalled();
        const callArgs = mockVerificationRepo.saveVerification.mock.calls[0];
        const token = callArgs[1];

        expect(token).toMatch(/^\d{6}$/); // Expect 6 digits
        // Ensure it's not a float string
        expect(token).not.toContain('.');
    });

    it('should increment attempts and throw error on invalid code (Attempt 1)', async () => {
        // Simulate finding the active request but code matching fails
        mockVerificationRepo.findVerification.mockResolvedValue(null);
        mockVerificationRepo.findActiveRequest.mockResolvedValue({ id: '123', attempts: 0 });

        await expect(service.verifyEmail('test@example.com', 'WRONG_CODE'))
            .rejects.toThrow(UnauthorizedException);

        expect(mockVerificationRepo.incrementAttempts).toHaveBeenCalledWith('123');
        expect(mockVerificationRepo.deleteVerification).not.toHaveBeenCalled(); // Not deleted yet
    });

    it('should invalidate/delete code on critical attempt limit (Attempt 3)', async () => {
        // Simulate scenario where attempts is already 2 (this is the 3rd fail)
        mockVerificationRepo.findVerification.mockResolvedValue(null);
        mockVerificationRepo.findActiveRequest.mockResolvedValue({ id: '123', attempts: 2 });

        await expect(service.verifyEmail('test@example.com', 'WRONG_CODE_AGAIN'))
            .rejects.toThrow('Too many failed attempts');

        expect(mockVerificationRepo.incrementAttempts).toHaveBeenCalledWith('123');
        expect(mockVerificationRepo.deleteVerification).toHaveBeenCalledWith('123');
    });
});
