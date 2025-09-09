import { Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { HttpLogContext, RMQLogContext } from '../constants';
import { HttpLogEntry, LogEntry, RMQLogEntry } from '../dto';

@Injectable()
export class NestLoggerFactory {
    static getLogFromError(error: Error): LogEntry {
        const log = new LogEntry();
        log.trace = error.stack;
        log.message = error.message;
        return log;
    }

    static getLogFromExpressRequest(
        request: { method: string; path: string }, 
        status: number, 
        message: any
    ): HttpLogEntry {
        const log = new HttpLogEntry();
        log.context = HttpLogContext.HttpRequest;
        log.httpMethod = request.method;
        log.url = request.path;
        log.httpStatus = status;
        log.message = message;
        return log;
    }

    static getLogFromAxiosResponse(response: AxiosResponse): HttpLogEntry {
        const log = new HttpLogEntry();
        log.context = HttpLogContext.HttpResponse;
        
        if (response.request) {
            log.httpMethod = response.request.method;
            log.url = response.request.path;
            log.httpStatus = response.status;
        }
        
        log.message = response.data;
        return log;
    }

    static getLogFromAxiosError(error: AxiosError): HttpLogEntry {
        const log = new HttpLogEntry();
        log.context = HttpLogContext.HttpResponse;
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            log.message = error.response.data;
            log.httpStatus = error.response.status;
        }
        
        log.message = error.message;
        
        if (error.request) {
            log.httpMethod = error.request.method;
            log.url = error.request.path;
        }
        
        return log;
    }

    static getLogByInboundRMQMessage(
        queue: string, 
        routingKey: string, 
        data: any
    ): RMQLogEntry {
        const log = new RMQLogEntry();
        log.context = RMQLogContext.RMQIn;
        log.queue = queue;
        log.routingKey = routingKey;
        log.message = data;
        return log;
    }

    static getLogByOutgoingRMQMessage(
        exchange: string, 
        routingKey: string, 
        data: any
    ): RMQLogEntry {
        const log = new RMQLogEntry();
        log.context = RMQLogContext.RMQOut;
        log.exchange = exchange;
        log.routingKey = routingKey;
        log.message = data;
        return log;
    }
}