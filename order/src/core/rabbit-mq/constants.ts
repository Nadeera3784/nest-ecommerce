export const CONNECT_EVENT: string = "connect";
export const RABBITMQ_CONFIG: string = "RABBITMQ_CONFIG";
export const RABBITMQ_SERVER: string = "RABBITMQ_SERVER";
export const DISCONNECT_EVENT: string = "disconnect";
export const DISCONNECT_MESSAGE: string =
  "Disconnected from RMQ. Trying to reconnect";
export const DEFAULT_EXPIRE_IN: number = 10 * 1000; // 10s
export const DEFAULT_CALL_TIMEOUT: number = 30 * 1000; // 30s
