import { NestFactory } from "@nestjs/core";
import { ApplicationModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(ApplicationModule);

  // Note: Add RABBITMQ_SERVER when RabbitMQ consumer is needed
  // const app: INestMicroservice =
  //   await NestFactory.createMicroservice<MicroserviceOptions>(
  //     ApplicationModule,
  //     {
  //       strategy: context.get(RABBITMQ_SERVER),
  //     },
  //   );
  // await app.listen();

  Logger.log(`Order Consumer started`);
}

bootstrap().catch();
