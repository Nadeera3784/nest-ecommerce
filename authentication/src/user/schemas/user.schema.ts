import { Schema } from 'mongoose';

export const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
    is_active: { type: Boolean, default: true },
    second_factor_required: { type: Boolean, default: false },
    ip_address: { type: String },
  },
  {
    timestamps: true,
    collection: 'users',
  },
);

// Index for faster email lookups
UserSchema.index({ email: 1 });

