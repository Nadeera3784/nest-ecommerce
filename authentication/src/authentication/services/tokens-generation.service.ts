import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { environment } from 'src/environments';
import {
  AccessTokenResultModel,
  TokensIssueParams,
  TokensResultModel,
  UserTokenInterface,
} from '../interfaces/tokens';

@Injectable()
export class TokensGenerationService {
  constructor(private readonly jwt: JwtService) {}

  public async issueToken(params: TokensIssueParams): Promise<TokensResultModel> {
    const nowSeconds: number = Math.floor(Date.now() / 1000);

    const accessExpiresIn: number | string = params.accessToken?.expiresIn ?? environment.jwtOptions.signOptions.expiresIn;
    const refreshExpiresIn: number | string | undefined = params.refreshToken?.expiresIn;

    const accessPayload: any = {
      ...params.accessToken?.userModel,
      iat: nowSeconds,
    };

    const result: TokensResultModel = {};

    if (params.accessToken) {
      result.accessToken = await this.jwt.signAsync(accessPayload, {
        secret: environment.jwtOptions.secret,
        expiresIn: accessExpiresIn as any,
      });
      result.expiresIn = accessExpiresIn;
    }

    if (params.refreshToken) {
      const refreshPayload: any = {
        payload: params.refreshToken.payload,
        iat: nowSeconds,
      };
      result.refreshToken = await this.jwt.signAsync(refreshPayload, {
        secret: environment.jwtOptions.secret,
        expiresIn: refreshExpiresIn as any,
      });
    }

    return result;
  }

  public async deleteToken(user: UserTokenInterface): Promise<void> {
    // No-op placeholder; in production this would revoke tokens in Redis/DB.
    return;
  }

  public async removeBusinessTokens(userIds: string[], businessId: string): Promise<void> {
    // No-op placeholder; implement according to your token store.
    return;
  }
}


