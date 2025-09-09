import { Injectable } from '@nestjs/common';
import { BindingsCollector } from '../bindings-collector';
import { RabbitMqConfig } from '../rabbit-mq.config';

@Injectable()
export class RabbitRefreshCommand {
  constructor(
    private readonly config: RabbitMqConfig,
    private readonly collector: BindingsCollector
  ) {}

  async rabbitRefresh(force?: boolean): Promise<void> {
    const c: any = this.collector as any;

    if (typeof c.refresh === 'function') {
      await c.refresh(!!force);
      return;
    }

    if (typeof c.clear === 'function') {
      await c.clear(!!force);
    }
    if (typeof c.rebuild === 'function') {
      await c.rebuild();
      return;
    }

    if (typeof c.collect === 'function') {
      await c.collect();
      return;
    }

    throw new Error(
      'BindingsCollector does not expose refresh/clear/rebuild/collect methods in this build.'
    );
  }
}
