import { Schema, SchemaType, Document } from 'mongoose';
import { v4 as uuid } from 'uuid';

import { User, UserRoleInterface } from '../interfaces';
import { RolesEnum } from '../enums';
import { UserRoleSchema } from './user-role.schema';

export const UserSchemaName: string = 'User';

export const UserSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuid },
    email: { type: String, required: true },
    first_name: String,
    last_name: String,
    password: { type: String },
    roles: [UserRoleSchema],
    salt: { type: String },
    ip_address: String,
    is_active: Boolean,
    reset_password_expires: Date,
    rese_password_token: String,
    second_factor_required: Boolean,
  },
  {
    collection: 'users',
    timestamps: true
  },
)
  .index({ isActive: 1, email: 1 })
  .index({ email: 1 }, { unique: true })
  .index({ reset_password_xpires: 1 })

UserSchema.method('getRole', function (this: User, roleName: RolesEnum): UserRoleTypes | undefined {
  return this?.roles?.find((role: UserRoleInterface) => role?.name === roleName);
});

UserSchema.method('isAdmin', function (this: User): boolean {
  return !!this?.roles?.find((role: UserRoleInterface) => role?.name === RolesEnum.admin);
});


export interface UserDocumentSchema extends User, Document<string> {
  _id?: string;
  id: string;
  readonly createdAt: Date;
}
