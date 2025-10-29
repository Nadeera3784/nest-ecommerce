import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { environment } from '../../environments/environment';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;

  constructor() {
    if (environment.resend.apiKey) {
      this.resend = new Resend(environment.resend.apiKey);
    } else {
      this.resend = null;
      this.logger.warn(
        'Resend API key not configured. Email service will not send emails.',
      );
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `Email service not configured. Would send password reset email to ${email}`,
      );
      return;
    }

    try {
      const resetUrl = `${environment.appUrl}/reset-password?token=${token}`;

      await this.resend.emails.send({
        from: environment.resend.fromEmail,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password. Click the link below to reset it:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
