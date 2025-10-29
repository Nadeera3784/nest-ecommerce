import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { UserDocument } from '../../user/interfaces/user.interface';
import { PasswordResetTokenInterface } from '../interfaces/password-reset-token.interface';
import { PasswordEncoder } from '../../user/tools/password.encoder';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('PasswordResetToken')
    private readonly passwordResetTokenModel: Model<PasswordResetTokenInterface>,
    @InjectQueue('password-reset-email') private readonly emailQueue: Queue,
  ) {}

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.passwordResetTokenModel.create({
      user: user._id,
      token,
      used: false,
      expires_at: expiresAt,
    });

    await this.emailQueue.add('send-password-reset-email', {
      email: user.email,
      token,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenModel.findOne({
      token,
      used: false,
      expires_at: { $gt: new Date() },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.userModel.findById(resetToken.user);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const salt = PasswordEncoder.salt();
    const hashedPassword = PasswordEncoder.encodePassword(newPassword, salt);

    user.password = hashedPassword;
    user.salt = salt;
    await user.save();

    resetToken.used = true;
    await resetToken.save();
  }
}

