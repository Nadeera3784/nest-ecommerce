import { DynamicModule, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApmService } from './apm.service';
import { ApmConfigService } from './apm-config.service';
import { ApmInterceptor } from './apm.interceptor';
import { ApiLogCollectingService } from './api-log-collecting.service';
import { ApiLogsEventsListener } from './listeners';
import { EventDispatcherModule } from '../event-dispatcher';
import { ApmOptionsInterface } from './apm.interface';

@Global()
export class ApmModule {
  static forRoot(
    enable: boolean = false,
    options: ApmOptionsInterface = {} as ApmOptionsInterface,
  ): DynamicModule {
    const providers = [
      ApmService,
      ApiLogsEventsListener,
      ApiLogCollectingService,
      {
        provide: APP_INTERCEPTOR,
        useClass: ApmInterceptor,
      },
      {
        provide: ApmConfigService,
        useValue: new ApmConfigService(enable, options),
      },
    ];

    const exportsArr = [ApmService, ApmConfigService];

    return {
      module: ApmModule,
      imports: [EventDispatcherModule],
      providers,
      exports: exportsArr,
    };
  }
}
