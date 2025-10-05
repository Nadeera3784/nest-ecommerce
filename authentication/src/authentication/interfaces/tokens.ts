export interface RoleModel {
  name: string;
}

export interface GuestUserTokenInterface {
  tokenId: string;
  hash?: string;
  guestHash?: string;
  removePreviousTokens?: boolean;
  roles: RoleModel[];
}

export interface UserTokenInterface {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessId?: string | null;
  clientId?: string | null;
  hash?: string | null;
  tokenType?: number | string;
  generalAccount?: boolean;
  removePreviousTokens?: boolean;
}

export interface AccessTokenPayload {
  userModel: Partial<UserTokenInterface> | GuestUserTokenInterface;
  expiresIn?: number | string;
  forceUseRedis?: boolean;
}

export interface RefreshTokenPayload {
  expiresIn?: number | string;
  payload?: {
    tokenId: string;
    userId: string;
    tokenType?: number | string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface GuestTokenParamsModel {
  accessToken: AccessTokenPayload;
}

export interface TokensIssueParams {
  accessToken: AccessTokenPayload;
  refreshToken?: RefreshTokenPayload;
}

export interface AccessTokenResultModel {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number | string;
  isSecurityQuestionDefined?: boolean;
}

export interface TokensResultModel extends AccessTokenResultModel {}


