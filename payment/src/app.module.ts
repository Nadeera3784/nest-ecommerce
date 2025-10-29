import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // TODO: Re-enable these modules after fixing their dependencies
    // NesLoggerModule.forRoot({
    //   applicationName: environment.applicationName,
    //   isProduction: environment.production,
    // }),
    // JwtModule.register(environment.jwtOptions),
    // MongooseModule.forRoot(environment.mongodb),
    // ApmModule.forRoot(environment.apm.enable, environment.apm.options),
    // CommandModule,
    // RabbitMqModule.forRoot(environment.rabbitmq),
    // PaymentsModule,
    // TransactionsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class ApplicationModule {}
