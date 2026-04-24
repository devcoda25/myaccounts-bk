import { Injectable } from '@nestjs/common';
import {
    AuthLoginMethod,
    AuthLoginOutcome,
    EmailOutcomeLabel,
    EmailProviderLabel,
    EmailTypeLabel,
    HttpMethodLabel,
    MinorApprovalOutcome,
    MinorLabel,
    MfaEventLabel,
    MfaMethodLabel,
    MfaOutcomeLabel,
    TokenRefreshOutcome,
    authLoginTotal,
    authTokenRefreshTotal,
    emailSendTotal,
    httpRequestDurationSeconds,
    httpRequestsTotal,
    mfaEventsTotal,
    minorApprovalTotal,
    userRegistrationsTotal,
} from './custom-metrics';

export type HttpMetricEvent = {
    method: HttpMethodLabel;
    route: string;
    status: number;
    durationSeconds: number;
};

function envFlagEnabled(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value !== 'false' && value !== '0';
}

@Injectable()
export class MetricsService {
    private readonly enabled: boolean;

    constructor() {
        // A global kill-switch is handy during incidents.
        const observabilityEnabled = envFlagEnabled(process.env.OBSERVABILITY_ENABLED, true);
        const metricsEnabled = envFlagEnabled(process.env.METRICS_ENABLED, true);
        this.enabled = observabilityEnabled && metricsEnabled;
    }

    recordHttpRequest(evt: HttpMetricEvent) {
        if (!this.enabled) return;
        const status = String(evt.status);
        httpRequestsTotal.labels(evt.method, evt.route, status).inc(1);
        httpRequestDurationSeconds.labels(evt.method, evt.route, status).observe(evt.durationSeconds);
    }

    recordLoginAttempt(method: AuthLoginMethod, outcome: AuthLoginOutcome) {
        if (!this.enabled) return;
        authLoginTotal.labels(method, outcome).inc(1);
    }

    recordTokenRefresh(outcome: TokenRefreshOutcome) {
        if (!this.enabled) return;
        authTokenRefreshTotal.labels(outcome).inc(1);
    }

    recordUserRegistration(minor: boolean) {
        if (!this.enabled) return;
        const label: MinorLabel = minor ? 'true' : 'false';
        userRegistrationsTotal.labels(label).inc(1);
    }

    recordMinorApproval(outcome: MinorApprovalOutcome) {
        if (!this.enabled) return;
        minorApprovalTotal.labels(outcome).inc(1);
    }

    recordEmailSend(provider: EmailProviderLabel, outcome: EmailOutcomeLabel, type: EmailTypeLabel) {
        if (!this.enabled) return;
        emailSendTotal.labels(provider, outcome, type).inc(1);
    }

    recordMfaEvent(event: MfaEventLabel, method: MfaMethodLabel, outcome: MfaOutcomeLabel) {
        if (!this.enabled) return;
        mfaEventsTotal.labels(event, method, outcome).inc(1);
    }
}