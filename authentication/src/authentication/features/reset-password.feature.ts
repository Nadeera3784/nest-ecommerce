import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { PasswordResetService } from '../services';
import { ResetPasswordDto } from '../dtos';

@Injectable()
export class ResetPasswordFeature extends Feature {
  constructor(private readonly passwordResetService: PasswordResetService) {
    super();
  }

  public async handle(resetPasswordDto: ResetPasswordDto) {
    try {
      await this.passwordResetService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.new_password,
      );

      return this.responseSuccess(
        HttpStatus.OK,
        'Password has been reset successfully',
        null,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Failed to reset password',
        error,
      );
    }
  }
}

