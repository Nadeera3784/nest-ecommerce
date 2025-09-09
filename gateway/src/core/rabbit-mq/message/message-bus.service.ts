import { Injectable } from '@nestjs/common';
import { MessageInterface, EncryptedMessageInterface } from './message.interface';
import * as crypto from 'crypto';
import { RabbitMqConfig } from '../rabbit-mq.config';

@Injectable()
export class MessageBusService {
  constructor(private readonly config: RabbitMqConfig) {}

  async wrapMessage(message: MessageInterface): Promise<string> {
    const encryption = this.config.getMessageEncryption();
    if (!encryption) {
      return JSON.stringify(message);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(encryption.private, 'base64'),
      iv,
    );

    let encrypted = cipher.update(JSON.stringify(message), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const encryptedMessage: EncryptedMessageInterface = {
      iv: iv.toString('base64'),
      content: encrypted,
    };

    return JSON.stringify(encryptedMessage);
  }

  async unwrapMessage(payload: string | EncryptedMessageInterface): Promise<MessageInterface> {
    const encryption = this.config.getMessageEncryption();
    if (!encryption) {
      return typeof payload === 'string' ? JSON.parse(payload) : (payload as any);
    }

    const { iv, content } =
      typeof payload === 'string' ? JSON.parse(payload) : payload;

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(encryption.private, 'base64'),
      Buffer.from(iv, 'base64'),
    );

    let decrypted = decipher.update(content, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}
