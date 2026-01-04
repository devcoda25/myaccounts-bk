import { Injectable, UnauthorizedException, Inject, forwardRef, BadRequestException, ConflictException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UserFindRepository } from '../../repos/users/user-find.repository';
import { UserCreateRepository } from '../../repos/users/user-create.repository';
import { UserCredentialRepository } from '../../repos/users/user-credential.repository';
import { LoginService } from './login.service';
import * as jose from 'jose';
import { KeyManager } from '../../utils/keys';

import appleSignin from 'apple-signin-auth';

@Injectable()
export class SocialAuthService {
    private googleClient: OAuth2Client;

    constructor(
        private userFindRepo: UserFindRepository,
        private userCreateRepo: UserCreateRepository,
        private userCredentialRepo: UserCredentialRepository,
        @Inject(forwardRef(() => LoginService)) private loginService: LoginService
    ) {
        // CLIENT_ID should be in env, but using a placeholder or env if available
        this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    }




    async verifyGoogleToken(token: string) {
        // Detect if it is an ID Token (JWT) or Access Token (Opaque)
        const isJwt = token.split('.').length === 3;

        if (isJwt) {
            // ID TOKEN FLOW (Standard Button)
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
                throw new UnauthorizedException('Google ID Token Verification Failed: ' + error.message);
            }
        } else {
            // ACCESS TOKEN FLOW (Custom Button / Implicit)
            try {
                // 1. Verify Audience (tokeninfo) - MUST match our Client ID
                const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
                if (!tokenInfoRes.ok) throw new Error('Failed to verify token info');
                const tokenInfo = await tokenInfoRes.json();

                if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
                    throw new UnauthorizedException('Token audience mismatch');
                }

                // 2. Get User Profile (userinfo)
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!userInfoRes.ok) throw new Error('Failed to fetch user info');
                const userInfo = await userInfoRes.json();

                return {
                    email: userInfo.email,
                    firstName: userInfo.given_name,
                    lastName: userInfo.family_name,
                    picture: userInfo.picture,
                    sub: userInfo.sub
                };
            } catch (error) {
                throw new UnauthorizedException('Google Access Token Verification Failed: ' + error.message);
            }
        }
    }

    async socialLogin(provider: 'google' | 'apple', token: string, deviceInfo: any = {}) {
        let profile;

        if (provider === 'google') {
            profile = await this.verifyGoogleToken(token);
        } else if (provider === 'apple') {
            try {
                // Verify Apple ID Token
                // clientId is usually the Bundle ID for iOS or Service ID for Web
                const appleIdTokenClaims = await appleSignin.verifyIdToken(token, {
                    audience: process.env.APPLE_CLIENT_ID, // client id - must accept array if multiple apps
                    ignoreExpiration: false, // default is false
                });

                profile = {
                    email: appleIdTokenClaims.email,
                    sub: appleIdTokenClaims.sub,
                    firstName: '', // Apple only returns name on first sign in via scope, but often not in token claims directly in same way
                    lastName: ''
                };
            } catch (err) {
                throw new UnauthorizedException('Apple Token Verification Failed: ' + err.message);
            }
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

        // Link/Update Social Credential
        await this.userCredentialRepo.upsert(provider, profile.sub, user.id, {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            picture: profile.picture
        });

        // Issue Session Tokens (Unified via LoginService)
        // Pass deviceInfo to create persistent session with metadata
        const tokens = await this.loginService.generateSessionToken({
            id: user.id,
            email: user.email,
            role: (user as any).role // Type assertion until Prisma types update
        }, deviceInfo);

        return {
            access_token: tokens.access_token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                otherNames: user.otherNames,
                avatarUrl: user.avatarUrl,
                role: (user as any).role
            }
        };
    }
    async linkAccount(userId: string, provider: 'google' | 'apple', token: string) {
        let profile;
        if (provider === 'google') {
            profile = await this.verifyGoogleToken(token);
        } else {
            try {
                const appleIdTokenClaims = await appleSignin.verifyIdToken(token, {
                    audience: process.env.APPLE_CLIENT_ID,
                    ignoreExpiration: false,
                });
                profile = {
                    email: appleIdTokenClaims.email,
                    sub: appleIdTokenClaims.sub,
                    firstName: '',
                    lastName: ''
                };
            } catch (err) {
                throw new UnauthorizedException('Apple Token Verification Failed');
            }
        }

        if (!profile || !profile.sub) throw new BadRequestException('Invalid token');

        // Check if already linked to ANOTHER user
        const existing = await this.userCredentialRepo.findByProvider(provider, profile.sub);
        if (existing && existing.userId !== userId) {
            throw new ConflictException('This social account is already linked to another user.');
        }

        // Upsert credential for THIS user
        await this.userCredentialRepo.upsert(provider, profile.sub, userId, {
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            picture: profile.picture
        });

        return { success: true };
    }
}
