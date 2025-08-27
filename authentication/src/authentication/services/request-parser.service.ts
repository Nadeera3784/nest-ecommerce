import { Hash } from '@pe/nest-kit';
import * as ipv from 'ip-address';
import * as userAgentParser from 'useragent';

import {
  FastifyRequestWithIpInterface,
} from '../interfaces';
import { environment } from '../../environments';
import { RequestFingerprint } from 'src/common/interfaces';
import { V3FastifyRequestWithIpInterface } from '../interfaces/v3-fastify-request-with-ip.interface';

export class RequestParser {
  private static precision: number = 16;

  public static parse(
    request: FastifyRequestWithIpInterface | V3FastifyRequestWithIpInterface,
    precision: number = 16,
  ): RequestFingerprint {
    if (!request) {
      return this.getEmptyFingerprint();
    }

    this.precision = precision;

    const userAgent: string = request.headers['user-agent'];
    const userAgentHash: string | undefined = userAgent ? Hash.generate(userAgent) : undefined;

    let browser: string | undefined;
    let os: string | undefined;
    let device: string | undefined;

    if (userAgent) {
      const parsedUserAgent: userAgentParser.Agent = userAgentParser.parse(userAgent);

      browser = parsedUserAgent ? parsedUserAgent.family : undefined;
      os = parsedUserAgent && parsedUserAgent.os ? parsedUserAgent.os.family : undefined;
      device = parsedUserAgent && parsedUserAgent.device ? parsedUserAgent.device.family : undefined;
    }

    const ipAddress: string = RequestParser.getValidIpAddress(request.ip || request.clientIp, false);
    const ipSubnet: string = RequestParser.getValidIpAddress(request.ip || request.clientIp, true);

    return { os, browser, device, userAgent, ipAddress: ipAddress, userAgentHash, ipSubnet };
  }

  private static getValidIpAddress(ipAddress: string, isSubnet: boolean): string {
    if (!ipAddress) {
      return null;
    }

    try {
      const ipv6: ipv.Address6 = new ipv.Address6(ipAddress);

      if (ipv6.isValid()) {
        if (!ipv6.is4()) {
          return isSubnet ?
            new ipv.Address6(ipAddress + '/64').startAddress().correctForm() :
            new ipv.Address6(ipAddress + '/64').correctForm();
        }

        ipAddress = ipv6.to4().correctForm();
      }

      const ipv4: ipv.Address4 = new ipv.Address4(ipAddress + `/${this.precision}`);

      if (ipv4.isValid() && !RequestParser.isTrustedProxy(ipv4)) {
        return isSubnet ? ipv4.startAddress().correctForm() : ipv4.correctForm();
      }
    } catch (e) { }

    return null;
  }

  private static isTrustedProxy(ipAddress: ipv.Address4): boolean {
    const trustedProxies: string[] = environment.trustedProxies.split(',');

    return !!trustedProxies.find((proxy: string) => {
      proxy = new ipv.Address4(proxy);

      return ipAddress.isInSubnet(proxy);
    });
  }

  private static getEmptyFingerprint(): RequestFingerprint {
    return {
      browser: undefined,
      ipAddress: undefined,
      os: undefined,
      userAgent: undefined,
      userAgentHash: undefined,
    };
  }
}
