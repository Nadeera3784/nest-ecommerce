import { Schema } from 'mongoose';
import { OriginalAclSchema } from './original-acl.schema';

export const AclSchema: Schema = new Schema(
  {
    create: { type: Boolean },
    delete: { type: Boolean },
    microservice: { type: String, required: true },
    original: OriginalAclSchema,
    read: { type: Boolean },
    update: { type: Boolean },
  },
  { _id: false },
);
