import { UserDocument } from '../../user/interfaces';
import { RequestFingerprint } from '../../common/interfaces';
import { LoginRequestDto } from './login-request.dto';

export const LOGIN_EVENT = 'user.login';

export interface LoginEvent {
  user: UserDocument;
  parsedRequest: RequestFingerprint;
  loginDto: LoginRequestDto;
  isValidPassword: boolean;
  isSecurityQuestionDefined: boolean;
}

