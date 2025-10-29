import { HttpLogContext } from '../constants';
import { LogEntry } from './base-log-entry';

export class HttpLogEntry extends LogEntry {
  context?: HttpLogContext;
  httpMethod?: string;
  httpStatus?: number;
  url?: string;
}
