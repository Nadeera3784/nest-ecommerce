import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { UserService } from '../services';

@Injectable()
export class GetUserFeature extends Feature {
  constructor(private readonly userService: UserService) {
    super();
  }

  public async handle(userId: string) {
    try {
      const user = await this.userService.findById(userId);

      return this.responseSuccess(
        HttpStatus.OK,
        'User retrieved successfully',
        user,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.NOT_FOUND,
        error.message || 'User not found',
        error,
      );
    }
  }
}

