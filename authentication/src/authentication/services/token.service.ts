import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AccessTokenResultModel,
  GuestTokenParamsModel,
  GuestUserTokenInterface,
  Hash,
  RolesEnum,
  TokensGenerationService,
  TokensResultModel,
  UserTokenInterface,
} from '@pe/nest-kit';
import { TokenType } from '@pe/nest-kit/modules/auth/enums/token-type.enum';
import { Model, Query } from 'mongoose';
import { v4 as uuid } from 'uuid';
import { RabbitMessagesEnum, RmqSender } from '../../common';
import { environment } from '../../environments';
import { User } from '../../users/interfaces';
import { UserTokenModel } from '../../users/models';
import { UserService } from '../../users/services';
import { GuestTokenRequestDto } from '../dto';
import { TokenType as OauthTokenType } from '../enum';
import {
  FastifyRequestWithIpInterface,
  RefreshPayload,
  RefreshTokenInterface,
  RequestFingerprint,
} from '../interfaces';
import { RequestParser } from './request-parser.service';
import { OAuthClient } from '../../oauth/interfaces';
import { LocationService } from './location.service';
import { TokenEventProducer } from '../producer';

@Injectable()
export class TokenService {
  constructor(
    private readonly userService: UserService,
    private readonly rmqSender: RmqSender,
    private readonly tokenEventProducer: TokenEventProducer,
    private readonly tokensGenerationService: TokensGenerationService,
    private readonly locationService: LocationService,
    @InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshTokenInterface>,
  ) { }

  public async getToken(conditions: any): Promise<RefreshTokenInterface> {
    return this.refreshTokenModel.findOne(conditions).populate({ path: 'user' });
  }

  public async getTokens(userId: string): Promise<RefreshTokenInterface[]> {
    return this.refreshTokenModel.find({ user: userId });
  }

  public async revokeTokens(userId: string, tokens: string[] | boolean): Promise<Query<any, any>> {
    const conditions: any = {
      revoked: false,
      user: userId,
    };

    if (tokens === true) {
      conditions.tokenType = OauthTokenType.oauth;
    }

    if (Array.isArray(tokens)) {
      conditions._id = { $in: tokens };
    }

    return this.refreshTokenModel.updateMany(conditions, { revoked: true });
  }

  public async issueGuestToken(
    request: FastifyRequestWithIpInterface,
    dto: GuestTokenRequestDto,
  ): Promise<AccessTokenResultModel> {
    const parsedRequest: RequestFingerprint = RequestParser.parse(request);
    let ipHash: string = dto.ipHash;
    if (!ipHash) {
      ipHash = Hash.generate(request.ip || request.clientIp);
    }
    const uniqueParamSet: string = parsedRequest.userAgentHash + ipHash;

    const tokenParams: GuestTokenParamsModel = {
      accessToken: {
        expiresIn: environment.guestTokenExpiresIn,
        forceUseRedis: true,
        userModel: {
          guestHash: Hash.generate(uniqueParamSet),
          hash: parsedRequest.userAgentHash,
          removePreviousTokens: false,
          roles: [
            {
              name: RolesEnum.guest,
            },
          ],
          tokenId: uuid(),
        } as GuestUserTokenInterface,
      },
    };

    return this.tokensGenerationService.issueToken(tokenParams);
  }

  public async issueToken(
    user: User,
    parsedRequest: RequestFingerprint,
    businessId: string,
    tokenType: TokenType = TokenType.common,
  ): Promise<TokensResultModel> {
    await this.deleteToken(UserTokenModel.fromUser(user, businessId, tokenType));

    return this.issueTokenFromModel(
      UserTokenModel.fromUser(user, businessId, tokenType),
      parsedRequest,
      null,
      businessId,
    );
  }

  public async issueTokenFromModel(
    userModel: UserTokenModel,
    parsedRequest: RequestFingerprint,
    oAuthClient: OAuthClient = null,
    businessId: string = null,
  ): Promise<TokensResultModel> {
    const refreshToken: RefreshTokenInterface =
      await this.storeRefreshToken(userModel.id, parsedRequest, !!oAuthClient, businessId);

    const result: TokensResultModel = await this.tokensGenerationService.issueToken({
      accessToken: {
        expiresIn: oAuthClient ? environment.oauthTokenExpiresIn : environment.jwtOptions.signOptions.expiresIn,
        forceUseRedis: false,
        userModel: {
          ...userModel,
          clientId: oAuthClient ? oAuthClient._id : null,
          hash: oAuthClient ? null : parsedRequest.userAgentHash,
          isOwner: await this.userService.isOwner(userModel.id, businessId),
          removePreviousTokens: !(oAuthClient || userModel.generalAccount),
        },
      },
      refreshToken: {
        expiresIn: environment.refreshTokenExpiresIn,
        payload: {
          email: userModel.email,
          firstName: userModel.firstName,
          lastName: userModel.lastName,
          tokenId: refreshToken._id,
          tokenType: userModel.tokenType,
          userId: userModel.id,
        },
      },
    });

    await this.tokenEventProducer.produceTokenIssuedEvent(userModel);

    return result;
  }

  public async refreshToken(
    user: RefreshPayload,
    parsedRequest: RequestFingerprint,
  ): Promise<AccessTokenResultModel> {
    if (!user.payload.tokenId || user.payload.tokenType === TokenType.secondFactorAuth) {
      throw new UnauthorizedException('forms.error.validator.token.invalid');
    }

    const tokenEntity: RefreshTokenInterface = await this.refreshTokenModel.findById(user.payload.tokenId).exec();

    if (!tokenEntity.isValid(parsedRequest.userAgent)) {
      await tokenEntity.invalidateRelated();
      throw new ForbiddenException(
        `Caution! Invalid refresh token received! Will invalidate all other refresh tokens.`,
      );
    }

    let userEntity: User = await this.userService.findOneBy({ _id: tokenEntity.user as string });

    if (!userEntity) {
      throw new ForbiddenException('User not found');
    }

    if (!!tokenEntity.businessId) {
      userEntity = await this.userService.findAndPopulateWithBusiness(userEntity._id, tokenEntity.businessId);
    }

    const verifiedLocation: boolean = await this.locationService.isLocationVerified(userEntity, parsedRequest);

    if (UserService.isSecondFactorAuth(userEntity) && !verifiedLocation) {
      throw new ForbiddenException('Location not verified! 2FA required');
    }

    return this.tokensGenerationService.issueToken({
      accessToken: {
        expiresIn: environment.jwtOptions.signOptions.expiresIn,
        userModel: {
          ...UserTokenModel.fromUser(userEntity, tokenEntity.businessId),
          hash: parsedRequest.userAgentHash,
          removePreviousTokens: !userEntity.generalAccount,
        },
      },
    });
  }

  public async removeTokens(userIds: string[], businessId: string): Promise<void> {
    return this.tokensGenerationService.removeBusinessTokens(userIds, businessId);
  }

  public async refreshTokenByUser(
    user: User, 
    tokenType: TokenType, 
    businessId: string,
  ): Promise<AccessTokenResultModel> {
    const userModel: UserTokenModel = UserTokenModel.fromUser(user, businessId, tokenType);

    return this.tokensGenerationService.issueToken({
      accessToken: {
        expiresIn: environment.jwtOptions.signOptions.expiresIn,
        userModel: {
          ...userModel,
          removePreviousTokens: !userModel.generalAccount,
        },
      },
    });
  }

  public async deleteToken(user: UserTokenInterface): Promise<any> {
     return this.tokensGenerationService.deleteToken(user);
  }

  private async storeRefreshToken(
    userId: string,
    parsedRequest: RequestFingerprint,
    isOauth: boolean = false,
    businessId: string = null,
  ): Promise<RefreshTokenInterface> {
    return this.refreshTokenModel.create({
      businessId,
      ip: parsedRequest.ipAddress,
      tokenType: isOauth ? OauthTokenType.oauth : OauthTokenType.auth,
      user: userId,
      userAgent: parsedRequest.userAgent,
    });
  }
}
