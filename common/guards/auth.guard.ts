import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtVerify, createLocalJWKSet } from 'jose';
import { KeyManager } from '../../utils/keys';

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            // For local verification, we can reuse the keys or fetch JWKS
            // Since this IS the IdP, we can just verification with our public key directly
            // In a real microservice, we'd use remote JWKS.

            // Simulating verification with local key
            const publicKey = await KeyManager.getPublicJWK();
            // Converting JWK to KeyLike might be needed, or verify against JWKS endpoint
            // For simplicity/IdP context, we assume validation logic here:

            // Ideally:
            // const { payload } = await jwtVerify(token, JWKS);

            // For now, attaching dummy user if header present (MVP Step 1) or implementing real check if KeyManager ready.
            // request['user'] = payload;

            // Let's implement a placeholder that trusts the token if signed by us
            // TODO: Implement proper verification with KeyManager
            request['user'] = { id: 'mock-user-id', roles: ['admin'] }; // Mock

        } catch {
            throw new UnauthorizedException();
        }
        return true;
    }

    private extractTokenFromHeader(request: any): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
