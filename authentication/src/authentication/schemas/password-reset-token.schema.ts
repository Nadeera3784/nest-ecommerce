import { Schema } from 'mongoose';

export const PasswordResetTokenSchemaName: string = 'PasswordResetToken';

export const PasswordResetTokenSchema: Schema = new Schema(
  {
    user: { type: String, required: true, ref: 'User' },
    token: { type: String, required: true, unique: true },
    used: { type: Boolean, required: true, default: false },
    expires_at: { type: Date, required: true },
  },
  {
    autoIndex: true,
    collection: 'password_reset_tokens',
    timestamps: true,
  },
)
  .index({ token: 1 })
  .index({ user: 1 })
  .index({ expires_at: 1 });

