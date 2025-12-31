import { GenerateKeyPairResult, generateKeyPair, exportJWK } from 'jose';
import * as fs from 'fs';
import * as path from 'path';

const KEYS_PATH = path.join(process.cwd(), 'certs');

export class KeyManager {
    private static publicKey: any;
    private static privateKey: any;

    static async init() {
        if (!fs.existsSync(KEYS_PATH)) {
            fs.mkdirSync(KEYS_PATH);
        }

        const pubPath = path.join(KEYS_PATH, 'public.json');
        const privPath = path.join(KEYS_PATH, 'private.pem');

        // In a real prod scenario, we'd load PEMs or use KMS. 
        // For now, generating/storing generic keys.
        if (!fs.existsSync(privPath)) {
            console.log('Generating new ES256 keys...');
            const { privateKey, publicKey } = await generateKeyPair('ES256');

            // Store private key (TODO: Safe storage)
            // This part is simplified for MVP - typically we might serialize encryption
            this.privateKey = privateKey;
            this.publicKey = publicKey;

            // We keep them in memory or save JWK
            const publicJwk = await exportJWK(publicKey);
            fs.writeFileSync(pubPath, JSON.stringify(publicJwk, null, 2));
            // Keeping private key in memory for this session or needing export logic
        } else {
            // Load keys logic would go here
            // For MVP restart, strictly regenerating or need export functions
        }
    }

    static async getPrivateKey() {
        if (!this.privateKey) {
            const { privateKey, publicKey } = await generateKeyPair('ES256');
            this.privateKey = privateKey;
            this.publicKey = publicKey;
        }
        return this.privateKey;
    }

    static async getPublicJWK() {
        if (!this.publicKey) {
            await this.getPrivateKey();
        }
        const jwk = await exportJWK(this.publicKey);
        // Add kid (Key ID) and use (sig)
        return { ...jwk, kid: 'evzone-key-1', use: 'sig', alg: 'ES256' };
    }
}
