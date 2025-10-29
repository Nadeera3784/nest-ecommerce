import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Processor('password-reset-email')
export class PasswordResetEmailQueue extends WorkerHost {
  private readonly logger = new Logger(PasswordResetEmailQueue.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<{ email: string; token: string }>): Promise<void> {
    this.logger.log(
      `Processing job ${job.id} - Sending password reset email to ${job.data.email}`,
    );

    try {
      await this.emailService.sendPasswordResetEmail(
        job.data.email,
        job.data.token,
      );
      this.logger.log(
        `Successfully sent password reset email to ${job.data.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${job.data.email}`,
        error,
      );
      throw error;
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} is now active`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has been completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
