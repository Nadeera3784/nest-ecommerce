import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DiscoveryModule } from "../discovery";
import { BindingsCollector } from "./bindings-collector";
import { RabbitSetupCommand, RabbitRefreshCommand } from "./commands";
import { RabbitMqConnection } from "./rabbit-mq.connection";
import { consumersProvidersFactory } from "./helper";
import { RestClient, ManagementService } from "./management";
import { MessageBusService } from "./message";
import { RabbitMqRPCClient } from "./rabbit-mq-rpc.client";
import { RabbitMqClient } from "./rabbit-mq.client";
import { RabbitMqConfig } from "./rabbit-mq.config";
import { RpcTimeoutHandler } from "./handlers";
import { RabbitMqConfigInterface } from "./interfaces";

@Global()
@Module({
  imports: [DiscoveryModule, HttpModule],
  providers: [
    MessageBusService,
    RabbitSetupCommand,
    RabbitRefreshCommand,
    RabbitMqClient,
    RabbitMqRPCClient,
    BindingsCollector,
    RestClient,
    ManagementService,
    RabbitMqConnection,
    RpcTimeoutHandler,
  ],
  exports: [
    MessageBusService,
    RabbitMqClient,
    RabbitMqRPCClient,
    RabbitMqConnection,
  ],
})
export class RabbitMqModule {
  static forRoot(config: RabbitMqConfigInterface): DynamicModule {
    const rabbitMqConfig = new RabbitMqConfig(config);

    const providers: Provider[] = [
      {
        provide: RabbitMqConfig,
        useValue: rabbitMqConfig,
      },
    ];

    const queueProviders = consumersProvidersFactory(
      (rabbitMqConfig as any).consumers || [],
    );
    for (const provider of queueProviders) {
      providers.push(provider);
    }

    return {
      module: RabbitMqModule,
      providers: [...providers],
      exports: [
        {
          provide: RabbitMqConfig,
          useValue: rabbitMqConfig,
        },
      ],
    };
  }
}
