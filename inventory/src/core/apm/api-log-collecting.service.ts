import { Injectable, ExecutionContext } from '@nestjs/common';
import { EventDispatcher } from '../event-dispatcher';
import { ApmConfigService } from './apm-config.service';
import { ApiLogEventEnum } from './enums/api-logs-event.enum';

type AnyRequest =
  | {
      body?: any;
      headers?: any;
      hostname?: string;
      id?: any;
      ip?: string;
      ips?: string[];
      log?: any;
      method?: string;
      params?: any;
      protocol?: string;
      query?: any;
      routerPath?: string;
      url?: string;
      validationError?: any;
      [key: string]: any;
    }
  | undefined;

@Injectable()
export class ApiLogCollectingService {
  constructor(
    private readonly eventDispatcher: EventDispatcher,
    private readonly apmConfigService: ApmConfigService,
  ) {}

  async collectLog(
    context: ExecutionContext,
    data: any,
    error: any,
    start: number,
  ): Promise<void> {
    await this.eventDispatcher.dispatch(
      ApiLogEventEnum.APICALLTRACKED,
      this.parseContext(context, data, error, start),
    );
  }

  private parseContext(
    context: ExecutionContext,
    data: any,
    error: any,
    start: number,
  ) {
    const type = context.getType<'http' | 'ws' | 'rpc' | 'graphql' | string>();
    let request: AnyRequest = {};

    switch (true) {
      case type === 'ws': {
        request = {
          body: context.switchToWs().getData(),
        };
        break;
      }
      case type === 'rpc': {
        // microservices pattern (TCP/NATS/etc.)
        request = {
          body: context.switchToRpc().getData?.(),
        };
        break;
      }
      case type === 'graphql': {
        // args: [root, args, ctx, info]
        const args = context.getArgs?.() ?? [];
        request = {
          body: args[1],
        };
        break;
      }
      default: {
        // http
        request = context.switchToHttp().getRequest();
        break;
      }
    }

    const response = context.switchToHttp().getResponse();

    // Safely clone body removing circular references
    let body: any;
    try {
      const cache: any[] = [];
      body = JSON.parse(
        JSON.stringify((request as AnyRequest)?.body, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.includes(value)) return;
            cache.push(value);
          }
          return value;
        }),
      );
    } catch {
      body = (request as AnyRequest)?.body;
    }

    return {
      request: {
        body,
        headers: request?.headers,
        hostname: request?.hostname,
        id: request?.id,
        ip: request?.ip,
        ips: request?.ips,
        log: request?.log,
        method: type !== 'http' ? type : request?.method,
        params: request?.params,
        protocol: request?.protocol,
        query: request?.query,
        routerPath: request?.routerPath,
        url: request?.url,
        validationError: request?.validationError,
      },
      response: {
        data,
        error: error?.response,
        headers:
          typeof response?.getHeaders === 'function'
            ? response.getHeaders()
            : null,
        statusCode: error?.status ?? response?.statusCode,
      },
      responseTime: Date.now() - start,
      serviceName: this.apmConfigService.get('serviceName'),
    };
  }
}
