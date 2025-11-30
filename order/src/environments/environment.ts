import { Error } from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";
import { MessageBusChannelsEnum } from "../common/enums";

const isNumeric: (n: any) => boolean = (n: any): boolean => {
  return !isNaN(parseInt(n, 10)) && isFinite(n);
};

dotenv.config();
const env: NodeJS.ProcessEnv = process.env;

export const environment: any = {
  apm: {
    enable: env.APM_SERVICE_ENABLE === "true",
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
  applicationName: env.APP_NAME || "order",
  jwtOptions: {
    secret: env.JWT_SECRET_TOKEN,
    signOptions: {
      expiresIn: isNumeric(env.JWT_EXPIRES_IN)
        ? parseInt(env.JWT_EXPIRES_IN, 10)
        : env.JWT_EXPIRES_IN,
    },
  },
  mongodb: env.MONGODB_URL,
  port: env.APP_PORT || 3000,
  production: env.PRODUCTION_MODE === "true",

  rabbitmq: {
    expireInMS: 10000,
    managementUrl: env.RABBITMQ_MANAGEMENT_URL,
    shouldLogEvents: (env.RABBITMQ_SHOULD_LOG_EVENTS ?? "true") === "true",
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
        name: "async_events",
        options: { durable: true },
        type: "direct",

        queues: [
          {
            name: MessageBusChannelsEnum.order,
            options: {
              deadLetterExchange: "async_events_fallback",
              deadLetterRoutingKey: MessageBusChannelsEnum.order,
              durable: true,
            },
          },
          {
            name: MessageBusChannelsEnum.inventory,
            options: {
              deadLetterExchange: "async_events_fallback",
              deadLetterRoutingKey: MessageBusChannelsEnum.inventory,
              durable: true,
            },
          },
        ],
      },
    ],
  },
  redis: {
    clusterHosts: process.env.REDIS_CLUSTER_HOSTS
      ? process.env.REDIS_CLUSTER_HOSTS.split(",")
      : [],
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || "5000", 10),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD || "",
    port: +(process.env.REDIS_PORT || "6379"),
    retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || "5", 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || "1000", 10),
    url: env.REDIS_URL,
  },
};
