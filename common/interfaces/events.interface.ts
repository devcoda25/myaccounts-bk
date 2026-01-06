export interface BaseEvent<T = any> {
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

export const EventPattern = {
    // Payment
    PAYMENT_RECEIVED: process.env.KAFKA_TOPIC_PAYMENT_RECEIVED || 'payment.received',
    PAYMENT_PROCESSED: process.env.KAFKA_TOPIC_PAYMENT_PROCESSED || 'payment.processed',

    // KYC
    KYC_UPLOADED: process.env.KAFKA_TOPIC_KYC_UPLOADED || 'kyc.uploaded',
    KYC_VERIFIED: process.env.KAFKA_TOPIC_KYC_VERIFIED || 'kyc.verified',

    // Email
    MAIL_SEND: process.env.KAFKA_TOPIC_MAIL_SEND || 'mail.send',

    // Auth
    USER_LOGGED_IN: process.env.KAFKA_TOPIC_USER_LOGGED_IN || 'auth.user.login',
    USER_LOCKED: process.env.KAFKA_TOPIC_USER_LOCKED || 'auth.user.locked',
} as const;

export type EventPatternType = typeof EventPattern[keyof typeof EventPattern];
