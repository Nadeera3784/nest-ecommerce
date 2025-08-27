import { UnauthorizedException } from '@nestjs/common';

export class ExpiredPasswordException extends UnauthorizedException {
  public readonly message: string = 'Password session is expired';
  public readonly reason: string = 'REASON_EXPIRED_PASSWORD';
}
