import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { AuthService } from '../services';
import { LoginDto } from '../dtos';

@Injectable()
export class LoginFeature extends Feature {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async handle(loginDto: LoginDto, userAgent?: string) {
    try {
      const result = await this.authService.login(loginDto, userAgent);

      return this.responseSuccess(HttpStatus.OK, 'Login successful', result);
    } catch (error) {
      return this.responseError(
        HttpStatus.UNAUTHORIZED,
        error.message || 'Login failed',
        error,
      );
    }
  }
}
