import { Model } from 'mongoose';

import { User } from '../interfaces';

export interface UserModel extends Model<User> {
  is_permanently_blocked: (user: User, ipAddress: string) => Promise<boolean>;
}
