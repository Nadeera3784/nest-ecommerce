import { Global, Injectable } from "@nestjs/common";
import { connect } from "amqplib";
import { BindingsCollector } from "../bindings-collector";
import { Driver } from "../driver";
import { RestClient } from "./rest.client";
import { RabbitMqConfig } from "../rabbit-mq.config";

type Binding = { name: string; channel?: string };

@Global()
@Injectable()
export class ManagementService {
  constructor(
    private readonly config: RabbitMqConfig,
    private readonly collector: BindingsCollector,
    private readonly restClient: RestClient,
  ) {}

  async setup(consumerDependent: boolean): Promise<void> {
    const actualBindings: Binding[] = await this.collector.getBindings();
    await this.setupActualBindings(actualBindings, consumerDependent);
    await this.clearQueueFromBindingsOutOfActual(actualBindings);
  }

  async setupQueues(consumerDependent?: boolean): Promise<void> {
    return this.setup(consumerDependent || false);
  }

  private async setupActualBindings(
    bindings: Binding[],
    consumerDependent: boolean,
  ): Promise<void> {
    for (const url of this.config.getConnectionUrls()) {
      const conn = await connect(url);
      const channel = await conn.createChannel();
      await Driver.setup(
        channel as any,
        this.config,
        bindings as any,
        consumerDependent,
      );
    }
  }

  private async clearQueueFromBindingsOutOfActual(
    bindings: Binding[],
  ): Promise<void> {
    for (const exchange of this.config.getExchanges()) {
      for (const queue of exchange.queues) {
        let bindingsName: string[];

        if (!this.config.isMultipleQueue()) {
          bindingsName = bindings.map((b) => b.name);
        } else {
          bindingsName = bindings
            .filter((b) => b.channel === queue.name)
            .map((b) => b.name);
        }

        const queueBindings: string[] = await this.restClient.getQueueBindings(
          exchange.name,
          queue.name,
        );

        const oldBindings = queueBindings.filter(
          (b) => !bindingsName.includes(b),
        );

        for (const binding of oldBindings) {
          await this.restClient.removeQueueBinding(
            exchange.name,
            queue.name,
            binding,
          );
        }
      }
    }
  }
}
