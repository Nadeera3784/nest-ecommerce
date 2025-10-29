import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AuthenticationModule } from './authentication/authentication.module';
import { UserModule } from './user/user.module';
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
    BullModule.forRoot({
      connection: {
        host: environment.redis.host,
        port: environment.redis.port,
        password: environment.redis.password,
      },
    }),
    AuthenticationModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class ApplicationModule {}
