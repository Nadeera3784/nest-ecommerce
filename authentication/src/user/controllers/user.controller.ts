import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../authentication/guards/jwt-auth.guard';
import { UpdateUserDto } from '../dtos';
import {
  GetUserFeature,
  GetAllUsersFeature,
  UpdateUserFeature,
  DeleteUserFeature,
} from '../features';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly getUserFeature: GetUserFeature,
    private readonly getAllUsersFeature: GetAllUsersFeature,
    private readonly updateUserFeature: UpdateUserFeature,
    private readonly deleteUserFeature: DeleteUserFeature,
  ) {}

  @Get()
  async findAll(
    @Query('limit') limit: string = '10',
    @Query('skip') skip: string = '0',
    @Res() response: any,
  ) {
    const { status, response: featureResponse } =
      await this.getAllUsersFeature.handle(
        parseInt(limit, 10),
        parseInt(skip, 10),
      );
    return response.status(status).json(featureResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() response: any) {
    const { status, response: featureResponse } =
      await this.getUserFeature.handle(id);
    return response.status(status).json(featureResponse);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Res() response: any,
  ) {
    const { status, response: featureResponse } =
      await this.updateUserFeature.handle(id, updateUserDto);
    return response.status(status).json(featureResponse);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() response: any) {
    const { status, response: featureResponse } =
      await this.deleteUserFeature.handle(id);
    return response.status(status).json(featureResponse);
  }
}

