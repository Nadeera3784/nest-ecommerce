import { Injectable } from '@nestjs/common';
import * as APM from 'elastic-apm-node';
import copy = require('utils-copy-error');
import { ApmConfigService } from './apm-config.service';

@Injectable()
export class ApmService {
  private agent: typeof APM;

  constructor(private readonly apmConfigService: ApmConfigService) {
    this.agent = APM;
    if (apmConfigService.get('enabled') && !this.agent.isStarted()) {
      this.agent.start(apmConfigService.get());
    }
  }

  async captureError(error: any): Promise<void> {
    const code = error.status;
    if (!this.shouldSkipError(error) && this.shouldLogError(code)) {
      return new Promise((resolve) => {
        this.agent.captureError(ApmService.reformatErrMessage(error), () => {
          resolve();
        });
        resolve();
      });
    }
  }

  startTransaction(name: string, type?: string) {
    return this.agent.startTransaction(name, type);
  }

  setTransactionName(name: string) {
    return this.agent.setTransactionName(name);
  }

  startSpan(name: string) {
    return this.agent.startSpan(name);
  }

  setCustomContext(context: Record<string, any>) {
    return this.agent.setCustomContext(context);
  }

  setTag(name: string, value: string) {
    return this.agent.setLabel(name, value);
  }

  private shouldSkipError(error: any): boolean {
    const skipExceptions = this.apmConfigService.get('skipExceptions');
    if (!skipExceptions || !skipExceptions.length) {
      return false;
    }
    for (const errorType of skipExceptions) {
      if (error instanceof errorType) {
        return true;
      }
    }
    return false;
  }

  private shouldLogError(errorCode?: number): boolean {
    const codes = this.apmConfigService.get('codes')
      ? this.apmConfigService.get('codes')
      : '5xx';
    return !errorCode || codes === '(4|5)xx' || errorCode >= 500;
  }

  static reformatErrMessage(err: any): any {
    if (!(err instanceof Error)) {
      return err;
    }
    // unwrap inner error if necessary
    // @ts-ignore
    if (err.message instanceof Error) {
      return err.message;
    }
    try {
      const errClone = copy(err);
      // @ts-ignore
      errClone.__error_callsites = err.__error_callsites;
      errClone.message = JSON.stringify(errClone.message, null, ' ');
      return errClone;
    } catch {
      return err;
    }
  }
}
