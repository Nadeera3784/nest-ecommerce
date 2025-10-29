import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AuthController } from './controllers/auth.controller';
import { AuthService, EmailService, PasswordResetService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserSchema } from '../user/schemas/user.schema';
import { RefreshTokenSchema, PasswordResetTokenSchema } from './schemas';
import { environment } from '../environments/environment';
import {
  LoginFeature,
  RegisterFeature,
  RefreshTokenFeature,
  LogoutFeature,
  GetProfileFeature,
  RequestPasswordResetFeature,
  ResetPasswordFeature,
} from './features';
import { PasswordResetEmailQueue } from './queues/password-reset-email.queue';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: environment.jwtOptions.secret,
      signOptions: {
        expiresIn: environment.jwtOptions.signOptions.expiresIn,
      },
    }),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'RefreshToken', schema: RefreshTokenSchema },
      { name: 'PasswordResetToken', schema: PasswordResetTokenSchema },
    ]),
    BullModule.registerQueue({
      name: 'password-reset-email',
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    PasswordResetService,
    LoginFeature,
    RegisterFeature,
    RefreshTokenFeature,
    LogoutFeature,
    GetProfileFeature,
    RequestPasswordResetFeature,
    ResetPasswordFeature,
    JwtStrategy,
    PasswordResetEmailQueue,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthenticationModule {}
