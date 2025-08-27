import { Injectable, Logger } from '@nestjs/common';
import { Severity } from '../constants';
import { NestLoggerOptions } from '../interfaces';

@Injectable()
export class NestLogger extends Logger {
    constructor(private readonly options: NestLoggerOptions) {
        super();
    }

    log(message: any, context?: string): void {
        if (this.options.isProduction) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(message), JSON.stringify(context || message.context));
        } else {
            Logger.log(message, context || message.context);
        }
    }

    error(message: any, trace?: string, context?: string): void {
        if (this.options.isProduction) {
            if (typeof message !== 'object') {
                message = { message };
            }
            message.context = context || message.context;
            message.trace = trace || message.trace;
            this.createLogEntry(Severity.Error, message);
        } else {
            Logger.error(message, trace, context || message.context);
        }
    }

    warn(message: any, context?: string): void {
        if (this.options.isProduction) {
            if (typeof message !== 'object') {
                message = { message };
            }
            message.context = context || message.context;
            this.createLogEntry(Severity.Warning, message);
        } else {
            Logger.warn(message, context || message.context);
        }
    }

    createLogEntry(severity: Severity, message: any): void {
        const getCircularReplacer = () => {
            const seen = new WeakSet();
            return (key: string, value: any) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return;
                    }
                    seen.add(value);
                }
                return value;
            };
        };

        if (typeof message.message === 'object') {
            message.message = JSON.stringify(message.message, getCircularReplacer());
        }

        // eslint-disable-next-line no-console
        console.log(
            JSON.stringify(
                {
                    applicationId: this.options.applicationName,
                    severity,
                    timestamp: new Date(),
                    ...message,
                },
                getCircularReplacer()
            )
        );
    }
}