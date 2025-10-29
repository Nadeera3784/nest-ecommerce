export class LogEntry {
    message: any;
    trace?: any;

    constructor(message?: any, trace?: any) {
        this.message = message;
        this.trace = trace;
    }
}
