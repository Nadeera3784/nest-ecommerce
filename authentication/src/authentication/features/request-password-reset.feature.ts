import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { PasswordResetService } from '../services';
import { RequestPasswordResetDto } from '../dtos';

@Injectable()
export class RequestPasswordResetFeature extends Feature {
  constructor(private readonly passwordResetService: PasswordResetService) {
    super();
  }

  public async handle(requestPasswordResetDto: RequestPasswordResetDto) {
    try {
      await this.passwordResetService.requestPasswordReset(
        requestPasswordResetDto.email,
      );

      return this.responseSuccess(
        HttpStatus.OK,
        'Password reset email has been sent',
        null,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Failed to request password reset',
        error,
      );
    }
  }
}

