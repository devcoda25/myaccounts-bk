import { Global, Module } from '@nestjs/common';
import { MetricsService } from '../../src/metrics/metrics.service';
import { AppLogger } from '../../src/observability/app-logger.service';

@Global()
@Module({
    providers: [MetricsService, AppLogger],
    exports: [MetricsService, AppLogger],
})
export class ObservabilityModule { }