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

    async validateUser(identifier: string, pass: string): Promise<any> {
        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (!user || !user.passwordHash) return null;
        if (await argon2.verify(user.passwordHash, pass)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async generateSessionToken(user: any, deviceInfo: any = {}) {
        // 1. Create Persistent Session
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        // Default device info structure if empty
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
            expiresAt: expiresAt,
            deviceInfo: finalDevice
        });

        // 2. Asymmetric Session Token (ES256) include 'jti' (Session ID)
        const privateKey = await KeyManager.getPrivateKey();

        const token = await new jose.SignJWT({
            sub: user.id,
            jti: session.id, // <--- Link to DB Session
            email: user.email,
            role: user.role || 'USER'
        })
            .setProtectedHeader({ alg: 'ES256', kid: 'evzone-key-1' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(privateKey);

        return { access_token: token };
    }
}
