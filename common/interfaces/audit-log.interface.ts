export interface AuditLogDetails {
    outcome?: 'Success' | 'Failure' | 'Pending';
    target?: string;
    requestId?: string;
    reason?: string;
    [key: string]: string | number | boolean | null | undefined | object;
}

export interface LoginAuditDetails extends AuditLogDetails {
    method: 'password' | 'google' | 'passkey';
    remember?: boolean;
}

export interface AppManagementAuditDetails extends AuditLogDetails {
    clientId: string;
    action: 'created' | 'updated' | 'deleted' | 'secret_rotated';
}
