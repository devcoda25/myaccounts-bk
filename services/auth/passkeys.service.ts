import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma-lib/prisma.service';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

@Injectable()
export class PasskeysService {
    private rpName = 'EVzone MyAccounts';
    private rpID = 'localhost'; // Should be domain in prod
    private origin = 'http://localhost:5173'; // Frontend origin

    constructor(private prisma: PrismaService) { }

    async listPasskeys(userId: string) {
        const creds = await this.prisma.userCredential.findMany({
            where: { userId, providerType: 'passkey' }
        });
        return creds.map(c => ({
            id: c.id,
            credentialID: c.providerId,
            createdAt: '2025-01-01T00:00:00Z', // Todo: add createdAt to UserCredential or infer
            ...((c.metadata as any) || {})
        }));
    }

    async generateRegistrationOptions(userId: string, userEmail: string) {
        // getUserCredentials
        const userPasskeys = await this.prisma.userCredential.findMany({
            where: { userId, providerType: 'passkey' }
        });

        const options = await generateRegistrationOptions({
            rpName: this.rpName,
            rpID: this.rpID,
            userID: isoBase64URL.toBuffer(userId), // Uint8Array
            userName: userEmail,
            attestationType: 'none',
            excludeCredentials: userPasskeys.map(passkey => ({
                id: passkey.providerId, // base64url credential ID
                transports: (passkey.metadata as any)?.transports,
            })),
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'cross-platform',
            },
        });

        // Store challenge in DB? For now return it and client sends it back (insecure but common in stateless demos)
        // Better: store in session. 
        // We will return it, controller handles session storage.
        return options;
    }

    async verifyRegistration(userId: string, body: any, expectedChallenge: string) {
        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: this.origin,
            expectedRPID: this.rpID,
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

            // Save to DB
            // providerId = credential.id (base64url)
            // secretHash = credential.publicKey (base64url or buffer)
            const metadata = {
                transports: body.response.transports,
                counter: credential.counter,
                deviceType: credentialDeviceType,
                backedUp: credentialBackedUp
            };

            await this.prisma.userCredential.create({
                data: {
                    userId,
                    providerType: 'passkey',
                    providerId: credential.id,
                    secretHash: isoBase64URL.fromBuffer(credential.publicKey),
                    metadata: metadata as any
                }
            });

            return { verified: true };
        }
        throw new BadRequestException('Verification failed');
    }

    async deletePasskey(userId: string, id: string) {
        const cred = await this.prisma.userCredential.findUnique({ where: { id } });
        if (!cred || cred.userId !== userId) throw new UnauthorizedException('Access denied');

        await this.prisma.userCredential.delete({ where: { id } });
        return { success: true };
    }
}
