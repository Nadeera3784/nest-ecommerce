import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { AuthService } from '../services';
import { RegisterDto } from '../dtos';

@Injectable()
export class RegisterFeature extends Feature {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async handle(registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);

      return this.responseSuccess(
        HttpStatus.CREATED,
        'Registration successful',
        result,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Registration failed',
        error,
      );
    }
  }
}

