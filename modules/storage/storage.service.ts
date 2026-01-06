import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { validateEnv } from '../../utils/env.validation';

@Injectable()
export class StorageService {
    private s3: S3Client;
    private bucket: string;
    private readonly logger = new Logger(StorageService.name);

    constructor() {
        const config = validateEnv(process.env);
        this.bucket = config.S3_BUCKET;
        this.s3 = new S3Client({
            endpoint: config.S3_ENDPOINT,
            region: config.S3_REGION,
            credentials: {
                accessKeyId: config.S3_ACCESS_KEY_ID,
                secretAccessKey: config.S3_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true, // Needed for many S3-compatible providers like MinIO/DO Spaces sometimes
        });
    }

    async upload(key: string, body: Buffer | Uint8Array, contentType: string, isPublic: boolean = false) {
        try {
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
                ACL: isPublic ? 'public-read' : 'private',
            }));
            this.logger.log(`Uploaded ${key} to ${this.bucket}`);
            return key;
        } catch (err) {
            this.logger.error(`Upload failed for ${key}`, err);
            throw err;
        }
    }

    async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            return await getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
        } catch (err) {
            this.logger.error(`Failed to generate signed URL for ${key}`, err);
            throw err;
        }
    }

    getPublicUrl(key: string): string {
        const config = validateEnv(process.env);
        // Assuming strict S3 endpoint usage (bucket.endpoint or endpoint/bucket)
        // DO Spaces style: https://bucket.region.digitaloceanspaces.com/key
        const endpoint = config.S3_ENDPOINT.replace('https://', '').replace('http://', '');
        return `https://${this.bucket}.${endpoint}/${key}`;
    }
}
