export class RpcTimeoutHandler {
  private readonly timeoutMs: number;

  constructor(timeout: number) {
    this.timeoutMs = timeout;
  }


  handle<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`RPC timeout after ${this.timeoutMs} ms`));
      }, this.timeoutMs);

      promise
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
