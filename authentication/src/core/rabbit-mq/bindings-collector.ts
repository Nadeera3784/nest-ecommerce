import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '../discovery';
import { BINDINGS_METADATA } from './decorators/constants';
import { BindingsMethodInterface } from './interfaces';

@Injectable()
export class BindingsCollector {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  collect(): BindingsMethodInterface[] {
    const bindings: BindingsMethodInterface[] = [];

    const controllers = this.discoveryService.getControllers();
    for (const wrapper of controllers) {
      const { instance } = wrapper;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);

      this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodName: string) => {
          const methodRef = prototype[methodName];
          const bindingMetadata: BindingsMethodInterface | undefined =
            Reflect.getMetadata(BINDINGS_METADATA, methodRef);

          if (bindingMetadata) {
            bindings.push(bindingMetadata);
          }
        },
      );
    }

    return bindings;
  }
}
