import { Injectable } from '@nestjs/common';
import { ApmOptionsInterface } from './apm.interface';

@Injectable()
export class ApmConfigService {
  constructor(
    private readonly enable: boolean,
    private readonly options: ApmOptionsInterface,
  ) {
    if (!options.ignoreUrls) {
      options.ignoreUrls = [];
    }
    options.ignoreUrls.push('/api/status');

    this.options = {
      ...options,
      apiRequestTime: '20s',
      serverTimeout: '30s',
    };
  }

  get(): ApmOptionsInterface;
  get(key: 'enabled'): boolean;
  get<K extends keyof ApmOptionsInterface>(key: K): ApmOptionsInterface[K];
  get(key?: keyof ApmOptionsInterface | 'enabled'): any {
    if (!key) {
      return this.options;
    }
    if (key === 'enabled') {
      return this.enable;
    }
    return this.options[key];
  }
}
