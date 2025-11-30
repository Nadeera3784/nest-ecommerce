import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { CartModule } from "./cart/cart.module";
import { OrdersModule } from "./orders/orders.module";
import { environment } from "./environments/environment";

@Module({
  imports: [
    MongooseModule.forRoot(environment.mongodb, {
      connectionFactory: (connection) => {
        connection.on("connected", () => {
          console.log("MongoDB connected successfully");
        });
        connection.on("error", (error) => {
          console.error("MongoDB connection error:", error);
        });
        return connection;
      },
    }),
    AuthModule,
    CartModule,
    OrdersModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class ApplicationModule {}
