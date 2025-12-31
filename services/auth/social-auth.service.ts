import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import * as jose from 'jose';

@Injectable()
export class SocialAuthService {
    private googleClient: OAuth2Client;

    constructor(
        private userFindRepo: UserFindRepository,
        private userCreateRepo: UserCreateRepository
    ) {
        // CLIENT_ID should be in env, but using a placeholder or env if available
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }

    async verifyGoogleToken(token: string) {
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) throw new UnauthorizedException('Invalid Google Token');

            return {
                email: payload.email,
                firstName: payload.given_name,
                lastName: payload.family_name,
                picture: payload.picture,
                sub: payload.sub
            };
        } catch (error) {
            // For MVP development (if no real Client ID), we might want a bypass or strict fail.
            // Following "OAuth latest version", we strictly fail usually.
            // But if user is just testing UI, they can't generate real tokens easily without setup.
            // We will assume real setup or valid failure.
            throw new UnauthorizedException('Google Token Verification Failed: ' + error.message);
        }
    }

    async socialLogin(provider: 'google' | 'apple', token: string) {
        let profile;

        if (provider === 'google') {
            profile = await this.verifyGoogleToken(token);
        } else if (provider === 'apple') {
            // Validating Apple Sign In (Mock for now or needs apple-signin-auth)
            // JWT decoding logic usually
            profile = { email: 'apple_user@example.com', sub: 'apple_123', firstName: 'Apple', lastName: 'User' };
        }

        if (!profile || !profile.email) throw new UnauthorizedException('No email found in token');

        // Find or Create User
        let user = await this.userFindRepo.findOneByEmail(profile.email);
        if (!user) {
            user = await this.userCreateRepo.create({
                email: profile.email,
                firstName: profile.firstName || '',
                otherNames: profile.lastName || '',
                passwordHash: null, // Social user
                emailVerified: true, // Trusted provider
                avatarUrl: profile.picture
            });
        }

        // Issue Session Tokens (Similar to LoginService)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret');
        const accessToken = await new jose.SignJWT({ sub: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);

        return {
            access_token: accessToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                otherNames: user.otherNames,
                avatarUrl: user.avatarUrl
            }
        };
    }
}
