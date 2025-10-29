import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { AuthService } from '../services';

@Injectable()
export class GetProfileFeature extends Feature {
  constructor(private readonly authService: AuthService) {
    super();
  }

  public async handle(userId: string) {
    try {
      const user = await this.authService.validateUser(userId);

      const userProfile = {
        userId: user._id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      };

      return this.responseSuccess(
        HttpStatus.OK,
        'Profile retrieved successfully',
        userProfile,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.UNAUTHORIZED,
        error.message || 'Failed to retrieve profile',
        error,
      );
    }
  }
}

