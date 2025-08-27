import { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';

export const RoleTypeSchemaName: string = 'RoleType';

export const RoleTypeSchema: Schema = new Schema(
  {
    _id: { type: String, default: uuid },
    name: { type: String, unique: true },
  },
  {
    collection: 'role_types',
  },
);
