
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma-lib/prisma.service';

const mockPrismaService = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should fetch notifications for a user sorted by date', async () => {
      const userId = 'user-1';
      const mockNotifications = [{ id: '1', userId, createdAt: new Date() }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const result = await service.findAll(userId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read if it exists and belongs to user', async () => {
      const userId = 'user-1';
      const id = 'notif-1';
      (prisma.notification.count as jest.Mock).mockResolvedValue(1);
      (prisma.notification.update as jest.Mock).mockResolvedValue({ id, read: true });

      await service.markAsRead(userId, id);

      expect(prisma.notification.count).toHaveBeenCalledWith({ where: { id, userId } });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id },
        data: { read: true },
      });
    });

    it('should return null if notification not found or not owned', async () => {
        const userId = 'user-1';
        const id = 'notif-1';
        (prisma.notification.count as jest.Mock).mockResolvedValue(0);

        const result = await service.markAsRead(userId, id);

        expect(prisma.notification.count).toHaveBeenCalledWith({ where: { id, userId } });
        expect(prisma.notification.update).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });
  });
});
