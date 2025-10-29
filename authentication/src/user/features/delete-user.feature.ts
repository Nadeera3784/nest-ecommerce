import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { UserService } from '../services';

@Injectable()
export class DeleteUserFeature extends Feature {
  constructor(private readonly userService: UserService) {
    super();
  }

  public async handle(userId: string) {
    try {
      await this.userService.delete(userId);

      return this.responseSuccess(
        HttpStatus.OK,
        'User deleted successfully',
        null,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Failed to delete user',
        error,
      );
    }
  }
}

