import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import {
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '../dtos';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  LoginFeature,
  RegisterFeature,
  RefreshTokenFeature,
  LogoutFeature,
  GetProfileFeature,
  RequestPasswordResetFeature,
  ResetPasswordFeature,
} from '../features';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly loginFeature: LoginFeature,
    private readonly registerFeature: RegisterFeature,
    private readonly refreshTokenFeature: RefreshTokenFeature,
    private readonly logoutFeature: LogoutFeature,
    private readonly getProfileFeature: GetProfileFeature,
    private readonly requestPasswordResetFeature: RequestPasswordResetFeature,
    private readonly resetPasswordFeature: ResetPasswordFeature,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() response: any) {
    const { status, response: featureResponse } =
      await this.registerFeature.handle(registerDto);
    return response.status(status).json(featureResponse);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: any,
    @Res() response: any,
  ) {
    const userAgent = request.headers['user-agent'];

    const { status, response: featureResponse } =
      await this.loginFeature.handle(loginDto, userAgent);
    return response.status(status).json(featureResponse);
  }

  @Post('refresh')
  async refresh(
    @Body('refresh_token') refreshToken: string,
    @Req() request: any,
    @Res() response: any,
  ) {
    const userAgent = request.headers['user-agent'];

    const { status, response: featureResponse } =
      await this.refreshTokenFeature.handle(refreshToken, userAgent);
    return response.status(status).json(featureResponse);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body('refresh_token') refreshToken: string,
    @Res() response: any,
  ) {
    const { status, response: featureResponse } =
      await this.logoutFeature.handle(refreshToken);
    return response.status(status).json(featureResponse);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: any, @Res() response: any) {
    const { status, response: featureResponse } =
      await this.getProfileFeature.handle(request.user.userId);
    return response.status(status).json(featureResponse);
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() requestPasswordResetDto: RequestPasswordResetDto,
    @Res() response: any,
  ) {
    const { status, response: featureResponse } =
      await this.requestPasswordResetFeature.handle(requestPasswordResetDto);
    return response.status(status).json(featureResponse);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Res() response: any,
  ) {
    const { status, response: featureResponse } =
      await this.resetPasswordFeature.handle(resetPasswordDto);
    return response.status(status).json(featureResponse);
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'authentication',
      timestamp: new Date().toISOString(),
    };
  }
}
