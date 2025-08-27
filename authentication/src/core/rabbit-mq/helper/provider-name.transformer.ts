export class ProviderNameTransformer {
  static transform(queueName: string): string {
    return `${queueName.toUpperCase()}_CONSUMER`;
  }
}
