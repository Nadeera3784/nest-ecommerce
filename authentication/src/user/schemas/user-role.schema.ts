import { Schema } from 'mongoose';

import { PermissionSchema } from './permission.schema';

export const UserRoleSchema: Schema = new Schema(
  {
    name: {
      enum: ['user', 'admin', 'merchant'],
      required: true,
      type: String,
    },
    permissions: [{ type: String, ref: PermissionSchema }],
  },
  {
    _id: false,
    discriminatorKey: 'name',
  },
);
