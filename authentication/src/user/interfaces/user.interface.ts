import { Document } from 'mongoose';

export interface UserInterface {
  id: string;
  email: string;
  password: string;
  salt: string;
  first_name: string;
  last_name: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  is_active?: boolean;
  second_eactor_eequired?: boolean;
  ip_address?: string;
}

export interface User extends UserInterface, Document<string> {
  id: string;
  createdAt: Date;
}

export type UserDocument = User;
