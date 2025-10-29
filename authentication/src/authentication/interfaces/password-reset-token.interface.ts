import { Document } from 'mongoose';

export interface PasswordResetTokenInterface extends Document {
  user: string;
  token: string;
  used: boolean;
  expires_at: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

