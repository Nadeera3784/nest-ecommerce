import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { environment } from '../environments';
import { TokenType } from '../enum';
import { RefreshPayload, RefreshTokenInterface } from '../interfaces';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(@InjectModel('RefreshToken') private readonly refreshTokenModel: Model<RefreshTokenInterface>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: environment.jwtOptions.secret,
    });
  }

  public async validate(payload: RefreshPayload): Promise<RefreshPayload> {
    const token: RefreshTokenInterface = await this.refreshTokenModel.findOne({
      _id: payload.payload.tokenId,
      revoked: false,
    }).exec();

    if (!(token && token.tokenType === TokenType.auth)) {
      throw new UnauthorizedException('The token has been revoked or never existed');
    }

    return payload;
  }
}
