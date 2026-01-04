import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { SessionRepository } from '../../repos/auth/session.repository';
import * as argon2 from 'argon2';
import * as jose from 'jose';
import * as crypto from 'crypto';
import { KeyManager } from '../../utils/keys';

@Injectable()
export class LoginService {
    constructor(
        private userFindRepo: UserFindRepository,
        private sessionRepo: SessionRepository
    ) { }

    async validateUser(identifier: string, pass: string): Promise<Omit<import("@prisma/client").User, "passwordHash"> | null> {
        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (!user || !user.passwordHash) return null;
        if (await argon2.verify(user.passwordHash, pass)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async validatePassword(userId: string, pass: string): Promise<boolean> {
        const user = await this.userFindRepo.findOneById(userId);
        if (!user || !user.passwordHash) return false;
        return argon2.verify(user.passwordHash, pass);
    }

    async generateSessionToken(user: { id: string; email: string; role: string }, deviceInfo: any = {}) {
        // 1. Create Refresh Token (High Entropy)
        const refreshRandom = crypto.randomBytes(32).toString('hex');
        const refreshHash = await argon2.hash(refreshRandom);

        // 2. Create Persistent Session
        // Access Token = 15m, Refresh Token = 7d
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d

        const finalDevice = {
            device: 'Web Client',
            os: 'Unknown',
            browser: 'Unknown',
            location: 'Unknown',
            ip: 'Unknown',
            ...deviceInfo
        };

        const session = await this.sessionRepo.createSession({
            userId: user.id,
            tokenHash: refreshHash, // Store Hash
            expiresAt: expiresAt,
            deviceInfo: finalDevice
        });

        // 3. Generate Access Token JWT (Short-lived 15m)
        const privateKey = await KeyManager.getPrivateKey();
        const accessToken = await new jose.SignJWT({
            sub: user.id,
            jti: session.id, // Link to DB Session
            email: user.email,
            role: user.role || 'USER'
        })
            .setProtectedHeader({ alg: 'ES256', kid: 'evzone-key-1' })
            .setIssuedAt()
            .setExpirationTime('15m') // SHORT LIVED
            .sign(privateKey);

        // 4. Return Composite Refresh Token (SessionID . Secret)
        const compositeRefreshToken = `${session.id}.${refreshRandom}`;

        return {
            access_token: accessToken,
            refresh_token: compositeRefreshToken,
            expires_in: 900 // 15m in seconds
        };
    }

    async refreshSession(compositeToken: string) {
        // 1. Parse Token
        const [sessionId, refreshRandom] = compositeToken.split('.');
        if (!sessionId || !refreshRandom) throw new UnauthorizedException('Invalid token format');

        // 2. Lookup Session
        const session = await this.sessionRepo.findSessionById(sessionId);
        if (!session) throw new UnauthorizedException('Session not found');

        // 3. Validate Expiry
        if (session.expiresAt < new Date()) {
            await this.sessionRepo.deleteSession(sessionId); // Cleanup
            throw new UnauthorizedException('Session expired');
        }

        // 4. Validate Hash (Argon2)
        if (!session.refreshTokenHash) throw new UnauthorizedException('Invalid session state');
        const isValid = await argon2.verify(session.refreshTokenHash, refreshRandom);
        if (!isValid) {
            // SECURITY ALERT: Token reuse or hijacking attempt!
            // In a strict system, revoke ALL user sessions here.
            await this.sessionRepo.deleteSession(sessionId);
            throw new UnauthorizedException('Invalid refresh token');
        }

        // 5. ROTATION: Generate NEW Refresh Token
        const newRefreshRandom = crypto.randomBytes(32).toString('hex');
        const newRefreshHash = await argon2.hash(newRefreshRandom);

        // Update DB
        await this.sessionRepo.updateRefreshToken(sessionId, newRefreshHash);

        // 6. Generate NEW Access Token
        // Need to fetch user details again to ensure role/email are fresh
        const user = await this.userFindRepo.findOneById(session.userId);
        if (!user) throw new UnauthorizedException('User not found');

        const privateKey = await KeyManager.getPrivateKey();
        const newAccessToken = await new jose.SignJWT({
            sub: user.id,
            jti: session.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'ES256', kid: 'evzone-key-1' })
            .setIssuedAt()
            .setExpirationTime('15m')
            .sign(privateKey);

        const newCompositeRefreshToken = `${session.id}.${newRefreshRandom}`;

        return {
            access_token: newAccessToken,
            refresh_token: newCompositeRefreshToken,
            expires_in: 900
        };
    }
    async logout(sessionId: string) {
        return this.sessionRepo.deleteSession(sessionId);
    }
}
