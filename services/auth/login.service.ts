import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import * as argon2 from 'argon2';
import * as jose from 'jose';
import * as crypto from 'crypto';

@Injectable()
export class LoginService {
    constructor(private userFindRepo: UserFindRepository) { }

    async validateUser(identifier: string, pass: string): Promise<any> {
        const user = await this.userFindRepo.findOneByIdentifier(identifier);
        if (!user || !user.passwordHash) return null;
        if (await argon2.verify(user.passwordHash, pass)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async generateSessionToken(user: any) {
        // Simple Session Token (JWT)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
        const token = await new jose.SignJWT({ sub: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);
        return { access_token: token };
    }
}
