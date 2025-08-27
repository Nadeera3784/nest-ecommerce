import { Document, Query } from 'mongoose';

import { User } from '../../user/interfaces/user.interface';
import { TokenType } from '../enum';

export interface RefreshTokenInterface extends Document {
  shop_id: string;
  user: string | User;
  user_agent: string;
  revoked?: boolean;
  is_valid?: (userAgent: string) => boolean;
  invalidate_related: () => Query<RefreshTokenInterface, any>;
  invalidate_token: () => Promise<RefreshTokenInterface>;
  ip: string;
  token_type: TokenType;
}
