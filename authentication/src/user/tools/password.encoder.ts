import * as crypto from 'crypto';
import * as pbkdf2 from 'pbkdf2';

export class PasswordEncoder {
  private static iterations: number = 5000;
  private static passwordLength: number = 40;

  public static encodePassword(password: string, salt: string): string {
    return pbkdf2.pbkdf2Sync(String(password), salt, this.iterations, this.passwordLength, 'sha512').toString('base64');
  }

  public static salt(): string {
    return crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[.+=]+/g, '');
  }

  public static isPasswordValid(password: string, salt: string, hash: string): boolean {
    return hash && salt && password && hash === this.encodePassword(password, salt);
  }
}
