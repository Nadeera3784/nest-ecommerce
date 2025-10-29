import { Injectable, HttpStatus } from '@nestjs/common';

import { Feature } from '../../common/feature';
import { UserService } from '../services';

@Injectable()
export class GetAllUsersFeature extends Feature {
  constructor(private readonly userService: UserService) {
    super();
  }

  public async handle(limit: number = 10, skip: number = 0) {
    try {
      const result = await this.userService.findAll(limit, skip);

      return this.responseSuccess(
        HttpStatus.OK,
        'Users retrieved successfully',
        {
          ...result,
          limit,
          skip,
        },
      );
    } catch (error) {
      return this.responseError(
        HttpStatus.BAD_REQUEST,
        error.message || 'Failed to retrieve users',
        error,
      );
    }
  }
}

