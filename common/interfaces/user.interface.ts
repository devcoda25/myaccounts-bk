import { User, UserContact, UserCredential, Session, AuditLog, Kycrecord } from '@prisma/client';

export type UserWithProfile = User & {
    contacts?: UserContact[];
    credentials?: UserCredential[];
    sessions?: Session[];
    auditLogs?: AuditLog[];
    kyc?: Kycrecord | null;
    orgMemberships?: any[]; // Use any[] temporarily due to stale Prisma types
};

export type SanitizedUser = Omit<User, 'passwordHash' | 'twoFactorSecret' | 'recoveryCodes'>;
export type SanitizedUserWithProfile = Omit<UserWithProfile, 'passwordHash' | 'twoFactorSecret' | 'recoveryCodes'>;
