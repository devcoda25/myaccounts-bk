export interface IOrgMetadata {
    country?: string;
    currency?: string;
    logoDataUrl?: string;
    address?: string;
    defaultRolePolicy?: string;
    grants?: Record<string, boolean>;
    policy?: {
        defaultInviteRole?: string;
        requireAdminApproval?: boolean;
        requireMfaForAdmins?: boolean;
    };
}

export interface IOrgMember {
    userId: string;
    role: string;
    user?: {
        firstName?: string;
        otherNames?: string;
        email: string;
        avatarUrl?: string;
    };
}

export interface IAuditLog {
    id: string;
    createdAt: Date;
    actorName?: string;
    user?: {
        firstName?: string;
    };
    action: string;
    severity?: string;
}

export interface IOrgWallet {
    balance: number | string;
    currency: string;
    monthlyLimit?: number | string;
}

export interface IOrganizationWithRelations {
    id: string;
    name: string;
    createdAt: Date;
    metadata?: IOrgMetadata | any; // 'any' for transition if JSON type is tricky
    members?: IOrgMember[];
    wallets?: IOrgWallet[];
    auditLogs?: IAuditLog[];
    ssoEnabled: boolean;
    ssoDomains?: string[];
    walletEnabled: boolean;
    country?: string;
}
