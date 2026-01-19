import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KeyLike } from 'jose';
import { KeyManager } from '../../utils/keys';

@Injectable()
export class JwkService implements OnModuleInit {
    private readonly logger = new Logger(JwkService.name);
    private publicKey: KeyLike | null = null;

    async onModuleInit() {
        this.logger.log('Initializing JWK Service...');
        // Ensure KeyManager is initialized (it might already be from bootstrap)
        // But we double check to be safe and type-secure.
        await KeyManager.init();

        try {
            this.publicKey = KeyManager.getPublicKeyObject();
            this.logger.log('JWK Service: Public Key Cached Successfully.');
        } catch (error) {
            this.logger.error('CRITICAL: Failed to cache Public Key', error);
            throw error;
        }
    }

    getPublicKey(): KeyLike {
        if (!this.publicKey) {
            throw new Error('JwkService: Public Key not initialized');
        }
        return this.publicKey;
    }
}
