import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { KongUser } from '../interfaces';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): KongUser => {
    const request = ctx.switchToHttp().getRequest();

    return {
      userId: request.headers['x-user-id'],
      email: request.headers['x-user-email'],
      tokenId: request.headers['x-token-id'],
    };
  },
);
