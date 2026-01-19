import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../../modules/redis/redis.module';
import { User } from '@prisma/client';

export interface CachedSession {
    id: string;
    userId: string;
    isValid: boolean;
}

@Injectable()
export class AuthCacheService {
    private readonly logger = new Logger(AuthCacheService.name);
    private readonly TTL_SECONDS = 3600; // 1 Hour Cache

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    /**
     * Cache-Aside: Get Session
     */
    async getSession(sessionId: string): Promise<CachedSession | null> {
        try {
            const data = await this.redis.get(`session:${sessionId}`);
            if (data) {
                return JSON.parse(data) as CachedSession;
            }
        } catch (error) {
            this.logger.error(`Redis Error (getSession): ${(error as Error).message}`);
        }
        return null;
    }

    async setSession(session: CachedSession): Promise<void> {
        try {
            await this.redis.set(`session:${session.id}`, JSON.stringify(session), 'EX', this.TTL_SECONDS);
        } catch (error) {
            this.logger.error(`Redis Error (setSession): ${(error as Error).message}`);
        }
    }

    /**
     * Cache-Aside: Get User
     */
    async getUser(userId: string): Promise<User | null> {
        try {
            const data = await this.redis.get(`user:${userId}`);
            if (data) {
                // Determine if we need to parse Date objects if strictly mapped to Prisma types
                // For AuthRequest, we mainly need id, email, role.
                const user = JSON.parse(data);
                return user as User;
            }
        } catch (error) {
            this.logger.error(`Redis Error (getUser): ${(error as Error).message}`);
        }
        return null;
    }

    async setUser(user: User): Promise<void> {
        try {
            // Mask sensitive fields before caching if needed, but for AuthGuard usage we act as a cache.
            await this.redis.set(`user:${user.id}`, JSON.stringify(user), 'EX', this.TTL_SECONDS);
        } catch (error) {
            this.logger.error(`Redis Error (setUser): ${(error as Error).message}`);
        }
    }

    async revokeSession(sessionId: string): Promise<void> {
        try {
            await this.redis.del(`session:${sessionId}`);
        } catch (error) {
            this.logger.error(`Redis Error (revokeSession): ${(error as Error).message}`);
        }
    }
}
