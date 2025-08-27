import { FastifyRequest } from 'fastify';

export interface FastifyRequestWithIpInterface extends FastifyRequest<{
  Querystring: {
    shop_id?: string;
    client_id: string;
    client_secret: string;
    grant_type: string;
    scope: string;
  };
  Body: {

  };
  Headers: {
    'X-Bulk-Event-Id': string;
  };
}> {
  clientIp: string;
}
