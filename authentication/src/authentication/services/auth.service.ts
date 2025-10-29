import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../../user/interfaces/user.interface';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dtos';
import { PasswordEncoder } from '../../user/tools/password.encoder';
import { RefreshTokenInterface } from '../interfaces/refresh-token.interface';
import { TokenType } from '../enum/token-type.enum';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('RefreshToken')
    private readonly refreshTokenModel: Model<RefreshTokenInterface>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate salt and hash password
    const salt = PasswordEncoder.salt();
    const hashedPassword = PasswordEncoder.encodePassword(
      registerDto.password,
      salt,
    );

    // Create new user
    const newUser = new this.userModel({
      email: registerDto.email,
      password: hashedPassword,
      salt: salt,
      first_name: registerDto.first_name,
      last_name: registerDto.last_name,
      is_active: true,
    });

    const savedUser = await newUser.save();

    // Generate tokens
    return this.generateAuthResponse(savedUser);
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userModel.findOne({ email: loginDto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = PasswordEncoder.isPasswordValid(
      loginDto.password,
      user.salt,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateAuthResponse(user, userAgent);
  }

  async refreshToken(
    refreshToken: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: environment.jwtOptions.secret,
      });

      // Find refresh token in database
      const tokenDoc = await this.refreshTokenModel.findOne({
        _id: payload.tokenId,
        revoked: false,
        user: payload.userId,
      });

      if (!tokenDoc) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate user agent if provided
      if (userAgent && tokenDoc.user_agent !== userAgent) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if token type is auth
      if (tokenDoc.token_type !== TokenType.auth) {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user
      const user = await this.userModel.findById(payload.userId);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Revoke old refresh token
      await this.refreshTokenModel.updateOne(
        { _id: tokenDoc._id },
        { revoked: true },
      );

      // Generate new tokens
      return this.generateAuthResponse(user, userAgent);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: environment.jwtOptions.secret,
      });

      // Revoke the refresh token
      await this.refreshTokenModel.updateOne(
        { _id: payload.tokenId, user: payload.userId },
        { revoked: true },
      );

      return { message: 'Logged out successfully' };
    } catch {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  private async generateAuthResponse(
    user: UserDocument,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    // Create refresh token document
    const refreshTokenDoc = new this.refreshTokenModel({
      user: user._id,
      user_agent: userAgent,
      token_type: TokenType.auth,
      revoked: false,
    });

    const savedRefreshToken = await refreshTokenDoc.save();

    // Generate JWT payload
    const jwtPayload = {
      iss: 'nest-ecommerce-issuer',
      userId: user._id.toString(),
      email: user.email,
      tokenId: savedRefreshToken._id.toString(),
    };

    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: environment.jwtOptions.secret,
      expiresIn: environment.jwtOptions.signOptions.expiresIn,
    });

    // Generate refresh token (long-lived)
    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: environment.jwtOptions.secret,
      expiresIn: environment.refreshTokenExpiresIn || '7d',
    });

    // Convert expiresIn to seconds
    const expiresIn =
      typeof environment.jwtOptions.signOptions.expiresIn === 'number'
        ? environment.jwtOptions.signOptions.expiresIn
        : 3600;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      user: {
        id: user._id.toString(),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }
}
