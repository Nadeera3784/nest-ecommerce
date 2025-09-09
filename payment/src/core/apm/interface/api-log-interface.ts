import { FastifyRequest } from 'fastify';

export interface ApiLogInterface {
  serviceName: string;
  request: Omit<
    FastifyRequest,
    'is404' | 'raw' | 'req' | 'routerMethod' | 'socket' | 'connection'
  >;
  response: {
    headers: { [key: string]: string | number | string[] };
    statusCode: number;
    data: any;
    error: any;
  };
  responseTime: number;
}
