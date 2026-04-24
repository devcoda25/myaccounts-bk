import { Injectable } from '@nestjs/common';
import type { Logger as PinoLogger } from 'pino';
import { appLogger } from './logger';

export type LogMeta = Record<string, unknown>;

@Injectable()
export class AppLogger {
    private readonly logger: PinoLogger = appLogger;

    child(meta: LogMeta): PinoLogger {
        return this.logger.child(meta);
    }

    info(meta: LogMeta, msg: string) {
        this.logger.info(meta, msg);
    }

    warn(meta: LogMeta, msg: string) {
        this.logger.warn(meta, msg);
    }

    error(meta: LogMeta, msg: string) {
        this.logger.error(meta, msg);
    }

    debug(meta: LogMeta, msg: string) {
        this.logger.debug(meta, msg);
    }
}