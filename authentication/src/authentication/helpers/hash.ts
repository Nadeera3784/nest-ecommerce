import * as crypto from 'crypto';

export class Hash {
  public static generate(value: string): string {
    if (typeof value !== 'string') {
      value = String(value ?? '');
    }
    return crypto.createHash('sha256').update(value).digest('hex');
  }
}


