import { INestApplicationContext, INestMicroservice } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { RABBITMQ_SERVER } from './core/rabbit-mq';
import { ApplicationModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const context: INestApplicationContext = await NestFactory.createApplicationContext(ApplicationModule);

  const app: INestMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(ApplicationModule, {
    strategy: context.get(RABBITMQ_SERVER),
  });

  await app.listen();
  Logger.log(`Consumer started`);
}

bootstrap().catch();
