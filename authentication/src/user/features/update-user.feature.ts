import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { UserService } from '../services';
import { UpdateUserDto } from '../dtos';

@Injectable()
export class UpdateUserFeature extends Feature {
  constructor(private readonly userService: UserService) {
    super();
  }

  public async handle(userId: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userService.update(userId, updateUserDto);

      return this.responseSuccess(
        HttpStatus.OK,
        'User updated successfully',
        user,
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Failed to update user',
        error,
      );
    }
  }
}

