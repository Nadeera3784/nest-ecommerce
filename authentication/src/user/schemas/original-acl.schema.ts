import { Schema } from 'mongoose';

export const OriginalAclSchema: Schema = new Schema(
  {
    create: { type: Boolean },
    delete: { type: Boolean },
    microservice: { type: String, required: true },
    read: { type: Boolean },
    update: { type: Boolean },
  },
  { _id: false },
);
