import { DynamicModule, Global, Logger, Module } from "@nestjs/common";
import { NestLoggerOptions } from "./interfaces";
import { NestLogger, NestLoggerFactory } from "./services";

@Global()
@Module({
  providers: [NestLoggerFactory, Logger],
})
export class NesLoggerModule {
  static forRoot(config: NestLoggerOptions): DynamicModule {
    const providers = [
      {
        provide: NestLogger,
        useValue: new NestLogger(config),
      },
      Logger,
    ];

    return {
      exports: providers,
      module: NesLoggerModule,
      providers: providers,
    };
  }
}
