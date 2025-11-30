# Order Microservice

Shopping Cart & Order Management service for the NestJS E-commerce platform.

## Features

- **Shopping Cart**: Add, update, remove items from cart
- **Order Management**: Create orders, track status, view history
- **Payment Integration**: Connects with payment service via RabbitMQ
- **Inventory Sync**: Stock validation and reservation

## API Endpoints

### Cart Endpoints
```bash
GET    /cart              # Get user's cart
POST   /cart/add          # Add item to cart
PUT    /cart/:productId   # Update item quantity
DELETE /cart/:productId   # Remove item from cart
DELETE /cart              # Clear entire cart
```

### Order Endpoints
```bash
POST   /orders/checkout   # Create order from cart
GET    /orders            # Get user's order history
GET    /orders/:id        # Get order details
PUT    /orders/:id/status # Update order status (admin)
POST   /orders/:id/cancel # Cancel an order
```

## Running the service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Environment Variables

```bash
MONGODB_URL=mongodb://root:rootpassword@mongo_order:27017/orderdb?authSource=admin
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
REDIS_URL=redis://redis:6379
JWT_SECRET_TOKEN=your-secret-key
```

