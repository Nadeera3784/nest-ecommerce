import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { AuthService } from '../services';

@Injectable()
export class RefreshTokenFeature extends Feature {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async handle(refreshToken: string, userAgent?: string) {
    try {
      const result = await this.authService.refreshToken(
        refreshToken,
        userAgent,
      );

      return this.responseSuccess(
        HttpStatus.OK,
        'Token refreshed successfully',
        result,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.UNAUTHORIZED,
        error.message || 'Token refresh failed',
        error,
      );
    }
  }
}

