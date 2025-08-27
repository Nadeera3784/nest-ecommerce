export interface MethodCallObj {
  args: any[];
  instance: any;
  method: string;
}

export interface EventListenerParams {
  eventName: string;
  detach?: boolean;
  priority?: number;
}
