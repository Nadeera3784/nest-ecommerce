import { Schema } from 'mongoose';
import { AclSchema } from './acl.schema';
import { v4 as uuid } from 'uuid';
import { PermissionModel } from '../models';

export const PermissionSchemaName: string = 'Permission';

export const PermissionSchema: Schema = new Schema({
  _id: { type: String, default: uuid },
  acls: [AclSchema],
  role: String,
  user_id: String,
});

PermissionSchema.methods.hasAcls = function (this: PermissionModel): boolean {
  return this.acls.length > 0;
};
