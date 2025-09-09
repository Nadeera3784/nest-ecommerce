export class ArgvQueueNameExtractor {
  private static readonly QueueArg = '--queue=';

  static extract(argv: string[]): string | null {
    const index = argv.findIndex(arg => arg.startsWith(ArgvQueueNameExtractor.QueueArg));
    if (index === -1) {
      return null;
    }
    const flag = argv.slice(index).shift() as string; // safe because index !== -1
    return flag.replace(ArgvQueueNameExtractor.QueueArg, '');
  }
}
