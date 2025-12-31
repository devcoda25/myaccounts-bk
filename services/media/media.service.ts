import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
    private uploadDir = path.join(__dirname, '..', '..', 'uploads');

    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async saveFile(file: Buffer, filename: string): Promise<string> {
        const ext = path.extname(filename);
        const randomName = crypto.randomBytes(16).toString('hex');
        const newFilename = `${randomName}${ext}`;
        const filePath = path.join(this.uploadDir, newFilename);

        await fs.promises.writeFile(filePath, file);

        // Return relative URL
        return `/uploads/${newFilename}`;
    }
}
