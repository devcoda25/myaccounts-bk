import { Injectable } from '@nestjs/common';
import { UserQueryService } from '../users/user-query.service';

@Injectable()
export class PrivacyService {
    constructor(private readonly userQueryService: UserQueryService) { }

    async exportUserData(userId: string) {
        const fullProfile = await this.userQueryService.findById(userId, { fullProfile: true });

        // In a real scenario, this would generate a PDF or a structured JSON/CSV
        // and potentially send it via email or provide a temporary download link.
        // For now, we return the structured data which the frontend can then "download".

        return {
            exportedAt: new Date().toISOString(),
            userData: fullProfile,
            notice: 'This export contains all personal data associated with your EVzone account.'
        };
    }
}
