import { RMQLogContext } from '../constants';
import { LogEntry } from './base-log-entry';

export declare class RMQLogEntry extends LogEntry {
    context?: RMQLogContext;
    queue?: string;
    routingKey?: string;
    exchange?: string;
}
