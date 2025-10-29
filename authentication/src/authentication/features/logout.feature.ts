import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { AuthService } from '../services';

@Injectable()
export class LogoutFeature extends Feature {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async handle(refreshToken: string) {
    try {
      const result = await this.authService.logout(refreshToken);

      return this.responseSuccess(HttpStatus.OK, result.message, result);
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Logout failed',
        error,
      );
    }
  }
}

