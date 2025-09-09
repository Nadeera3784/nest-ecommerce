import { Options } from 'amqplib';
export interface PatternInterface {
    channel: string;
    exchange?: string;
    options?: Options.Publish;
}
