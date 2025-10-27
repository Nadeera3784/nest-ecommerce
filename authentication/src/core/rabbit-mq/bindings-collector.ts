import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '../discovery';
import { BindingsMethodInterface } from './interfaces';

const BINDINGS_METADATA = 'BINDINGS_METADATA';

@Injectable()
export class BindingsCollector {
  constructor(
    private readonly discoveryService: DiscoveryService,
  ) {}

  async collect(): Promise<BindingsMethodInterface[]> {
    const bindings: BindingsMethodInterface[] = [];

    const controllers = await this.discoveryService.controllers(() => true);
    for (const wrapper of controllers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        (name) => name !== 'constructor' && typeof prototype[name] === 'function'
      );

      for (const methodName of methodNames) {
        const methodRef = prototype[methodName];
        const bindingMetadata: BindingsMethodInterface | undefined =
          Reflect.getMetadata(BINDINGS_METADATA, methodRef);

        if (bindingMetadata) {
          bindings.push(bindingMetadata);
        }
      }
    }

    return bindings;
  }

  async getBindings(): Promise<BindingsMethodInterface[]> {
    return this.collect();
  }
}
