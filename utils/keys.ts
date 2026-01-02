import { GenerateKeyPairResult, generateKeyPair, exportJWK, importJWK } from 'jose';
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
        const privPath = path.join(KEYS_PATH, 'private.pem'); // We'll store JWK format for simplicity in this MVP

        if (!fs.existsSync(privPath)) {
            console.log('Generating new ES256 keys...');
            const { privateKey, publicKey } = await generateKeyPair('ES256');

            this.privateKey = privateKey;
            this.publicKey = publicKey;

            // Save Private Key as JWK for easy reloading (in prod use PEM or KMS)
            const privateJwk = await exportJWK(privateKey);
            fs.writeFileSync(privPath, JSON.stringify(privateJwk, null, 2));

            const publicJwk = await exportJWK(publicKey);
            fs.writeFileSync(pubPath, JSON.stringify(publicJwk, null, 2));
        } else {
            // Load existing keys
            const privateJwk = JSON.parse(fs.readFileSync(privPath, 'utf8'));
            this.privateKey = await importJWK(privateJwk, 'ES256');

            const publicJwk = JSON.parse(fs.readFileSync(pubPath, 'utf8'));
            this.publicKey = await importJWK(publicJwk, 'ES256');
        }
    }

    static async getPrivateKey() {
        if (!this.privateKey) {
            await this.init();
        }
        return this.privateKey;
    }

    static async getPublicJWK() {
        if (!this.publicKey) {
            await this.init();
        }
        const jwk = await exportJWK(this.publicKey);
        // Add kid (Key ID) and use (sig) - ensure consistency
        return { ...jwk, kid: 'evzone-key-1', use: 'sig', alg: 'ES256' };
    }
}
