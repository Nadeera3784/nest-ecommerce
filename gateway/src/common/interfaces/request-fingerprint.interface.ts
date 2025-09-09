export interface RequestFingerprint {
  userAgent?: string;
  ipAddress?: string;
  ipSubnet?: string;
  browser?: string;
  os?: string;
  device?: string;
  userAgentHash?: string;
}
