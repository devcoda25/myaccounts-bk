import { Counter, Histogram, Registry, register } from 'prom-client';

// Use the default global Registry so @willsoto/nestjs-prometheus can expose these metrics.
export const metricsRegistry: Registry = register;

const PREFIX = 'myaccounts_';

function getOrCreateCounter<L extends string>(
    name: string,
    factory: () => Counter<L>,
): Counter<L> {
    const existing = metricsRegistry.getSingleMetric(name);
    return (existing as Counter<L>) || factory();
}

function getOrCreateHistogram<L extends string>(
    name: string,
    factory: () => Histogram<L>,
): Histogram<L> {
    const existing = metricsRegistry.getSingleMetric(name);
    return (existing as Histogram<L>) || factory();
}

// --------------------
// HTTP
// --------------------
export type HttpMethodLabel = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'OTHER';

export type HttpLabels = 'method' | 'route' | 'status';

export const httpRequestsTotal = getOrCreateCounter<HttpLabels>(
    `${PREFIX}http_requests_total`,
    () =>
        new Counter<HttpLabels>({
            name: `${PREFIX}http_requests_total`,
            help: 'Total HTTP requests processed by myaccounts',
            labelNames: ['method', 'route', 'status'],
        }),
);

export const httpRequestDurationSeconds = getOrCreateHistogram<HttpLabels>(
    `${PREFIX}http_request_duration_seconds`,
    () =>
        new Histogram<HttpLabels>({
            name: `${PREFIX}http_request_duration_seconds`,
            help: 'HTTP request duration in seconds',
            labelNames: ['method', 'route', 'status'],
            // Buckets tuned for auth workloads
            buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        }),
);

// --------------------
// Business Metrics
// --------------------
export type AuthLoginLabels = 'method' | 'outcome';
export type AuthLoginMethod = 'password' | 'otp' | 'social' | 'oidc';
export type AuthLoginOutcome = 'success' | 'invalid_credentials' | 'blocked' | 'error';

export const authLoginTotal = getOrCreateCounter<AuthLoginLabels>(
    `${PREFIX}auth_login_total`,
    () =>
        new Counter<AuthLoginLabels>({
            name: `${PREFIX}auth_login_total`,
            help: 'Total login attempts by method and outcome',
            labelNames: ['method', 'outcome'],
        }),
);

export type RegistrationLabels = 'minor';
export type MinorLabel = 'true' | 'false';

export const userRegistrationsTotal = getOrCreateCounter<RegistrationLabels>(
    `${PREFIX}user_registrations_total`,
    () =>
        new Counter<RegistrationLabels>({
            name: `${PREFIX}user_registrations_total`,
            help: 'Total user registrations',
            labelNames: ['minor'],
        }),
);

export type MinorApprovalLabels = 'outcome';
export type MinorApprovalOutcome = 'sent' | 'resend' | 'approved' | 'expired' | 'denied' | 'error';

export const minorApprovalTotal = getOrCreateCounter<MinorApprovalLabels>(
    `${PREFIX}minor_parent_approval_total`,
    () =>
        new Counter<MinorApprovalLabels>({
            name: `${PREFIX}minor_parent_approval_total`,
            help: 'Under-18 parent approval events',
            labelNames: ['outcome'],
        }),
);

export type EmailSendLabels = 'provider' | 'outcome' | 'type';
export type EmailProviderLabel = 'sendgrid' | 'emailjs' | 'submail' | 'console' | 'unknown';
export type EmailOutcomeLabel = 'success' | 'failure';
export type EmailTypeLabel = 'verification' | 'password_reset' | 'otp' | 'invite' | 'minor_approval' | 'other';

export const emailSendTotal = getOrCreateCounter<EmailSendLabels>(
    `${PREFIX}email_send_total`,
    () =>
        new Counter<EmailSendLabels>({
            name: `${PREFIX}email_send_total`,
            help: 'Email send attempts by provider/outcome/type',
            labelNames: ['provider', 'outcome', 'type'],
        }),
);
// --------------------
// Sessions / Tokens
// --------------------
export type TokenRefreshLabels = 'outcome';
export type TokenRefreshOutcome = 'success' | 'missing' | 'invalid' | 'error';

export const authTokenRefreshTotal = getOrCreateCounter<TokenRefreshLabels>(
    `${PREFIX}auth_token_refresh_total`,
    () =>
        new Counter<TokenRefreshLabels>({
            name: `${PREFIX}auth_token_refresh_total`,
            help: 'Total refresh token attempts (cookie-based refresh)',
            labelNames: ['outcome'],
        }),
);

// --------------------
// MFA
// --------------------
export type MfaEventLabels = 'event' | 'method' | 'outcome';
export type MfaEventLabel =
    | 'setup_start'
    | 'setup_verify'
    | 'sms_send'
    | 'disable'
    | 'recovery_codes'
    | 'challenge_send'
    | 'challenge_verify';

export type MfaMethodLabel = 'totp' | 'sms' | 'whatsapp' | 'email' | 'unknown';
export type MfaOutcomeLabel = 'success' | 'failure' | 'rate_limited' | 'error';

export const mfaEventsTotal = getOrCreateCounter<MfaEventLabels>(
    `${PREFIX}mfa_events_total`,
    () =>
        new Counter<MfaEventLabels>({
            name: `${PREFIX}mfa_events_total`,
            help: 'MFA events (setup/challenge/etc) by method and outcome',
            labelNames: ['event', 'method', 'outcome'],
        }),
);