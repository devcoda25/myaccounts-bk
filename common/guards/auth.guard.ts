import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtVerify, importJWK } from 'jose';
import { KeyManager } from '../../utils/keys';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            const publicJwk = await KeyManager.getPublicJWK();
            const publicKey = await importJWK(publicJwk, 'ES256');

            const { payload } = await jwtVerify(token, publicKey, {
                algorithms: ['ES256'],
            });

            request['user'] = payload;
        } catch (err) {
            console.error('Token verification failed:', err);
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractToken(request: any): string | undefined {
        const authHeader = request.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
        }
        return request.cookies?.evzone_token;
    }
}
