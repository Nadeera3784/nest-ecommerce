import * as crypto from 'crypto';

export class IpAddressEncoder {

  public static encodeUsersIpAddress(ipAddress: string, userEmail: string): string {
    if (!ipAddress) {
      return '';
    }

    const hashedValue: string = userEmail ? ipAddress + userEmail : ipAddress;

    return crypto.createHash('md5').update(hashedValue).digest('hex');
  }
}
