export class BindingChannelQueueValidator {
  static validate(pattern: any, queues: string[]): void {
    const routingKey = pattern.routingKey ? pattern.routingKey : pattern.name;

    switch (true) {
      case queues.length <= 1:
        // single-queue setup doesn't require channel validation
        return;

      case !pattern.channel:
        throw new Error(
          `Channel is required at MessagePattern name "${routingKey}".`,
        );

      case !this.isChannelPresentsInQueues(pattern, queues):
        throw new Error(`Channel ${pattern.channel} not found in queues.`);

      case !this.isQueueNameUnique(pattern, queues):
        throw new Error(`Queue name ${pattern.channel} must be unique.`);
    }
  }

  private static isChannelPresentsInQueues(
    pattern: { channel?: string },
    queues: string[],
  ): boolean {
    return !!queues.find((queue) => queue === pattern.channel);
  }

  private static isQueueNameUnique(
    pattern: { channel?: string },
    queues: string[],
  ): boolean {
    return queues.filter((queue) => queue === pattern.channel).length === 1;
  }
}
