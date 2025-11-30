import { Error } from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { MessageBusChannelsEnum } from '../common/enums';

const isNumeric: (n: any) => boolean = (n: any): boolean => {
  return !isNaN(parseInt(n, 10)) && isFinite(n);
};

dotenv.config();
const env: NodeJS.ProcessEnv = process.env;

export const environment: any = {
  apm: {
    enable: env.APM_SERVICE_ENABLE === 'true',
    options: {
      active: env.ELASTIC_APM_ACTIVE,
      centralConfig: env.ELASTIC_APM_CENTRAL_CONFIG,
      logLevel: env.ELASTIC_APM_LOG_LEVEL,
      serverUrl: env.ELASTIC_APM_SERVER_URL,
      serviceName: env.ELASTIC_APM_SERVICE_NAME,
      skipExceptions: [Error.ValidationError],
    },
  },
  appNamespace: env.APP_NAMESPACE,
  applicationName: env.APP_NAME,
  jwtOptions: {
    // this should be set to PEM encoded private key for RSA/ECDSA for production
    // @see https://github.com/auth0/node-jsonwebtoken#jwtsignpayload-secretorprivatekey-options-callback
    secret: env.JWT_SECRET_TOKEN,
    signOptions: {
      expiresIn: isNumeric(env.JWT_EXPIRES_IN)
        ? parseInt(env.JWT_EXPIRES_IN, 10)
        : env.JWT_EXPIRES_IN,
    },
  },
  mongodb: env.MONGODB_URL,
  oauthTokenExpiresIn: isNumeric(env.OAUTH_EXPIRES_IN)
    ? parseInt(env.OAUTH_EXPIRES_IN, 10)
    : env.OAUTH_EXPIRES_IN,
  oauthTokenInCookie: {
    allow: true,
    domain: env.TOKEN_IN_COOKIE_DOMAIN || 'test.test.com',
  },
  port: env.APP_PORT,
  production: env.PRODUCTION_MODE === 'true',

  rabbitmq: {
    expireInMS: 10000,
    managementUrl: env.RABBITMQ_MANAGEMENT_URL,
    shouldLogEvents: (env.RABBITMQ_SHOULD_LOG_EVENTS ?? 'true') === 'true',
    urls: [env.RABBITMQ_URL],
    vhost: env.RABBITMQ_VHOST,

    isGlobalPrefetchCount: false,
    prefetchCount: 10,
    rsa: {
      private: env.RABBITMQ_CERTIFICATE_PATH
        ? path.resolve(env.RABBITMQ_CERTIFICATE_PATH)
        : undefined,
    },

    exchanges: [
      {
        name: 'async_events',
        options: { durable: true },
        type: 'direct',

        queues: [
          {
            name: MessageBusChannelsEnum.auth,
            options: {
              deadLetterExchange: 'async_events_fallback',
              deadLetterRoutingKey: MessageBusChannelsEnum.auth,
              durable: true,
            },
          },
          {
            name: MessageBusChannelsEnum.inventory,
            options: {
              deadLetterExchange: 'async_events_fallback',
              deadLetterRoutingKey: MessageBusChannelsEnum.inventory,
              durable: true,
            },
          },
        ],
      },
    ],
  },
  recaptchaSecret: process.env.RECAPTCHA_SECRET,
  redis: {
    clusterHosts: process.env.REDIS_CLUSTER_HOSTS
      ? process.env.REDIS_CLUSTER_HOSTS.split(',')
      : [],
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '5000', 10),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD || '',
    port: +(process.env.REDIS_PORT || '6379'),
    retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '5', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    url: env.REDIS_URL,
  },
  refreshTokenExpiresIn: isNumeric(env.JWT_REFRESH_TOKEN_EXPIRES_IN)
    ? parseInt(env.JWT_REFRESH_TOKEN_EXPIRES_IN, 10)
    : env.JWT_REFRESH_TOKEN_EXPIRES_IN,
  rsa: {
    private: env.RABBITMQ_CERTIFICATE_PATH
      ? path.resolve(env.RABBITMQ_CERTIFICATE_PATH)
      : undefined,
  },
  statusPort: env.STATUS_APP_PORT,
  trustedProxies: env.TRUSTED_PROXIES || '',
};
