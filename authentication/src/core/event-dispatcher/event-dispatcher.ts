import { Global, Injectable } from '@nestjs/common';
import { DiscoveryService } from '../discovery';
import { EVENT_LISTENER_METADATA } from './event.constants';
import { MethodCallObj } from './event.interfaces';

@Injectable()
@Global()
export class EventDispatcher {
  private listeners: Map<string, any[]>;

  constructor(private readonly discovery: DiscoveryService) {
    this.listeners = new Map();
  }

  async dispatch(
    params:
      | string
      | {
          eventName: string;
          onDetachedHandlersResolved?: () => void;
          onDetachedHandlersRejected?: () => void;
        },
    ...args: any[]
  ): Promise<any[]> {
    const eventName = typeof params === 'string' ? params : params.eventName;
    const listeners = await this.getListeners(eventName);
    const tasksMap: { [priority: number]: MethodCallObj[] } = {
      1: [],
    };
    const detachedTasks: MethodCallObj[] = [];

    for (const listener of listeners) {
      const method = listener.discoveredMethod.methodName;
      const instance = listener.discoveredMethod.parentClass.instance;
      const methodCallObj: MethodCallObj = {
        args,
        instance,
        method,
      };

      if (typeof listener.meta === 'object' && listener.meta.detach) {
        detachedTasks.push(methodCallObj);
      } else if (typeof listener.meta === 'object' && listener.meta.priority) {
        if (tasksMap[listener.meta.priority]) {
          tasksMap[listener.meta.priority].push(methodCallObj);
        } else {
          tasksMap[listener.meta.priority] = [methodCallObj];
        }
      } else {
        tasksMap[1].push(methodCallObj);
      }
    }

    const results = await this.runByPriorities(tasksMap);

    if (typeof params === 'object') {
      const tasks = detachedTasks.map((item) => {
        return item.instance[item.method](...item.args);
      });

      Promise.all(tasks)
        .then(params.onDetachedHandlersResolved)
        .catch(params.onDetachedHandlersRejected);
    }

    return results.filter((f) => f !== undefined && f !== null);
  }

  private async runByPriorities(tasksMap: {
    [priority: number]: MethodCallObj[];
  }): Promise<any[]> {
    const priorities = Object.keys(tasksMap).map((priority) =>
      parseInt(priority, 10),
    );
    priorities.sort((a, b) => b - a);

    let results: any[] = [];

    for (const priority of priorities) {
      const tasks = tasksMap[priority].map((item) => {
        return item.instance[item.method](...item.args);
      });

      const priorityResults = await Promise.all(tasks);
      results = [...results, ...priorityResults];
    }

    return results;
  }

  private async getListeners(event: string): Promise<any[]> {
    let listeners = this.listeners.get(event);

    if (undefined === listeners) {
      const methods = await this.discovery.providerMethodsWithMetaAtKey(
        EVENT_LISTENER_METADATA,
      );

      listeners = methods.filter((method) => {
        if (typeof method.meta === 'string') {
          return method.meta === event;
        } else if (typeof method.meta === 'object') {
          return method.meta.eventName === event;
        }
      });

      this.listeners.set(event, listeners);
    }

    return listeners;
  }
}
