import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UserSchema } from './schemas/user.schema';
import { UserController } from './controllers';
import { UserService } from './services';
import {
  GetUserFeature,
  GetAllUsersFeature,
  UpdateUserFeature,
  DeleteUserFeature,
} from './features';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [
    UserService,

    GetUserFeature,
    GetAllUsersFeature,
    UpdateUserFeature,
    DeleteUserFeature,
  ],
  exports: [UserService],
})
export class UserModule {}

