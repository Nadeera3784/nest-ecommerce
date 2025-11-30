import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RabbitMqModule } from './core/rabbit-mq';
import { environment } from './environments/environment';

@Module({
  imports: [
    MongooseModule.forRoot(environment.mongodb, {
      connectionFactory: (connection) => {
        connection.on('connected', () => {
          console.log('MongoDB connected successfully');
        });
        connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });
        return connection;
      },
    }),
    RabbitMqModule.forRoot(environment.rabbitmq),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class ApplicationModule {}
