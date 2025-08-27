import { FastifyRequest } from 'fastify';

import { ScopesEnum } from '../../common';

export interface V3FastifyRequestWithIpInterface extends FastifyRequest<{
  Querystring: {
    business_id?: string;
    client_id: string;
    client_secret: string;
    grant_type: string;
    scopes: ScopesEnum[];
  };
  Body: {

  };
  Headers: {
    'X-Bulk-Event-Id': string;
  };
}> {
  clientIp: string;
}
