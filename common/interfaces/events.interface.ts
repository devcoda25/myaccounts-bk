export interface BaseEvent<T = unknown> {
    eventId: string;
    occurredAt: string;
    eventType: string;
    payload: T;
    traceId?: string;
    actor?: {
        userId: string;
        role?: string;
    };
}

export interface UserCreatedEventPayload {
    userId: string;
    email: string;
    firstName: string | null;
    otherNames: string | null;
    country: string | null;
    role: string;
}

export interface OrgCreatedEventPayload {
    orgId: string;
    name: string;
    taxId?: string;
    icon?: string;
}

export interface OrgMembershipUpdatedEventPayload {
    orgId: string;
    userId: string;
    role: string; // "OWNER", "ADMIN", "MEMBER", "ACCOUNTANT"
}

export const EventPattern = {
    // Email
    MAIL_SEND: process.env.KAFKA_TOPIC_MAIL_SEND || 'mail.send',

    // Auth
    USER_LOGGED_IN: process.env.KAFKA_TOPIC_USER_LOGGED_IN || 'auth.user.login',
    USER_LOCKED: process.env.KAFKA_TOPIC_USER_LOCKED || 'auth.user.locked',

    // Organization & Corporate Pay
    ORG_CREATED: 'org.created',
    ORG_MEMBERSHIP_UPDATED: 'org.membership.updated',
    ORG_MEMBERSHIP_DELETED: 'org.membership.deleted',
} as const;

export type EventPatternType = typeof EventPattern[keyof typeof EventPattern];
