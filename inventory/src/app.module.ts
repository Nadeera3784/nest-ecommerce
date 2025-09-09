import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { environment } from './environments';
import { NesLoggerModule } from './core/nest-logger';
import { ApmModule } from './core/apm/apm.module';
import { CommandModule } from './core/command';
import { RabbitMqModule } from './core/rabbit-mq';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrderEventsController } from './integration/order-events.controller';

@Module({
  imports: [
    NesLoggerModule.forRoot({
      applicationName: environment.applicationName,
      isProduction: environment.production,
    }),
    JwtModule.register(environment.jwtOptions),
    MongooseModule.forRoot(
      environment.mongodb,
    ),
    ApmModule.forRoot(environment.apm.enable, environment.apm.options),
    CommandModule,
    RabbitMqModule.forRoot(environment.rabbitmq),
    ProductsModule,
    CategoriesModule,
  ],
  controllers: [OrderEventsController],
  providers: [],
})

export class ApplicationModule implements NestModule {
  public configure(): MiddlewareConsumer | void { }
}
