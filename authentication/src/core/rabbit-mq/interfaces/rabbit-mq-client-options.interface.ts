export class RabbitMqClientOptionsInterface {
  urls?: string[];

  callTimeoutMS?: number;

  expireInMS?: number;

  shouldLogEvents?: boolean;

  constructor(init?: Partial<RabbitMqClientOptionsInterface>) {
    this.callTimeoutMS = 180 * 1000;
    this.expireInMS = 10 * 1000;
    this.shouldLogEvents = true;

    if (init) {
      Object.assign(this, init);
    }
  }
}
