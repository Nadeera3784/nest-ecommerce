import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { utc } from 'moment';

import { ExpiredPasswordException, MalformedPasswordException } from '../exceptions';
import { environment } from '../../environments';

@Injectable()
export class EncryptionService {

  public async getPublicKey(): Promise<string> {
    const pubKeyObject: crypto.KeyObject = crypto.createPublicKey({
      format: 'pem',
      key: environment.encryption.masterKey,
    });

    return pubKeyObject.export({
      format: 'pem',
      type: 'pkcs1',
    }).toString();
  }

  public async decrypt(encryptedString: string): Promise<string> {
    try {
      const privateKey: string = await this.getPrivateKey();

      const decryptedString: Buffer = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(encryptedString, 'base64'),
      );

      return decryptedString.toString('utf8');
    } catch (e) {
      throw new MalformedPasswordException();
    }
  }

  public extractPassword(combo: string): string {
    if (combo.lastIndexOf('|') === -1) {
      throw new ExpiredPasswordException();
    }

    const password: string = combo.substring(0, combo.lastIndexOf('|'));
    const timestamp: string = combo.substring(combo.lastIndexOf('|') + 1);

    const timestampDate: Date = new Date(parseInt(timestamp, 10));
    timestampDate.setSeconds(timestampDate.getSeconds() + 60);

    if (
      !timestamp ||
      Math.abs(utc().valueOf() - timestampDate.getTime()) / 1000 > 60 * 5
    ) {
      throw new ExpiredPasswordException();
    }

    return password;
  }

  private async getPrivateKey(): Promise<string> {
    return environment.encryption.masterKey;
  }
}
