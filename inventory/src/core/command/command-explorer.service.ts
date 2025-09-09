import { Injectable } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

@Injectable()
export class CommandExplorerService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  explore(): any[] {
    const providers = this.discoveryService.getProviders();
    const commands = providers
      .filter((provider) => provider.isDependencyTreeStatic())
      .filter(({ instance, metatype }) => {
        if (!instance || !metatype) {
          return false;
        }
        return this.filterCommands(instance);
      })
      .map(({ instance }) => instance)
      .map((instance) =>
        this.exploreMethodsInInstance(
          instance,
          Object.getPrototypeOf(instance),
        ),
      )
      .reduce((prev, curr) => {
        return prev.concat(curr);
      });

    return commands;
  }

  exploreMethodsInInstance(
    instance: Record<string, any>,
    prototype: any,
  ): any[] {
    const instanceMethodNames = this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      (name) => name,
    );

    return instanceMethodNames
      .map((methodName) =>
        this.exploreMethodMetadata(instance, prototype, methodName),
      )
      .filter((command) => command);
  }

  exploreMethodMetadata(
    instance: Record<string, any>,
    prototype: any,
    methodName: string,
  ): any {
    const instanceCallback = instance[methodName];
    const isCommand = Reflect.getMetadata('__command__', instanceCallback);
    if (!isCommand) {
      return null;
    }

    const metadata = Reflect.getMetadata(
      '__commandMetadata__',
      instanceCallback,
    );

    return {
      ...metadata,
      methodName,
      _instance: instance,
    };
  }

  filterCommands(instance: Record<string, any>): boolean {
    // Check if instance is a command (simplified logic)
    Reflect.getMetadata('__command__', instance);
    return true;
  }

  exploreMethodsInInstancePendingCommand(
    instance: Record<string, any>,
    // _metatype parameter intentionally unused but required by interface
  ): any[] {
    const pendingCommands = Reflect.getMetadata(
      '__pending_command__',
      Object.getPrototypeOf(instance),
    );
    if (!pendingCommands) {
      return [];
    }

    return pendingCommands.map((command: any) => ({
      ...command,
      _instance: instance,
    }));
  }
}
