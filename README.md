# NestJS E-commerce Microservices Platform

A production-ready e-commerce platform built with NestJS microservices architecture and Kong Gateway.


## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)
- Git

### Start the Platform

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd nest-ecommerce

# 2. Start all services (this will build the Docker images)
docker-compose up -d --build

# Wait for services to be ready (~2-3 minutes for first build)

# 3. Configure Kong Gateway
make kong-config

# 4. Test the setup
make kong-test
```

**That's it!** Your e-commerce platform is now running at **http://localhost:8000** 🎉

## Services

| Service | Description | Port (Direct) | API Route (via Kong) |
|---------|-------------|---------------|----------------------|
| **Kong Gateway** | API Gateway | 8000 | - |
| **Authentication** | User auth & management | 3001 | `/api/auth/*` |
| **Inventory** | Products & categories | 3002 | `/api/inventory/*` |
| **Payment** | Orders & transactions | 3003 | `/api/payment/*` |
| **MongoDB** | Database | 27017-27019 | - |
| **RabbitMQ** | Message broker | 5672 | - |
| **Redis** | Cache | 6379 | - |

## API Endpoints

All APIs are accessed through Kong Gateway at **http://localhost:8000**

### Authentication Service
```bash
POST   /api/auth/register       # Register new user
POST   /api/auth/login          # User login
GET    /api/auth/profile        # Get user profile
POST   /api/auth/logout         # User logout
POST   /api/auth/refresh        # Refresh token
```

### Inventory Service
```bash
GET    /api/inventory/products          # List all products
GET    /api/inventory/products/:id      # Get product details
POST   /api/inventory/products          # Create product (admin)
PUT    /api/inventory/products/:id      # Update product (admin)
DELETE /api/inventory/products/:id      # Delete product (admin)
GET    /api/inventory/categories        # List categories
```

### Payment Service
```bash
POST   /api/payment/checkout            # Process checkout
GET    /api/payment/orders              # List user orders
GET    /api/payment/orders/:id          # Get order details
POST   /api/payment/refund              # Request refund
GET    /api/payment/transactions        # List transactions
```

## Management Commands

We've provided a comprehensive `Makefile` for easy management:

```bash
# Kong Gateway
make kong-up              # Start Kong Gateway
make kong-down            # Stop Kong Gateway
make kong-config          # Configure Kong services & routes
make kong-test            # Test Kong endpoints
make kong-status          # Check Kong status
make kong-logs            # View Kong logs
make kong-restart         # Restart Kong

# Services
make services-up          # Start all services
make services-down        # Stop all services
make services-logs        # View all service logs
make services-ps          # List running services

# Development
make dev-setup           # Initial development setup
make dev-reset           # Reset entire environment

# Testing
make rate-limit-test     # Test rate limiting
make load-test           # Run load test

# Help
make help                # Show all commands
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:8000 | All API requests |
| **Kong Admin API** | http://localhost:8001 | Kong configuration |
| **Kong Manager** | http://localhost:8002 | Kong web UI |
| **Konga Admin** | http://localhost:1337 | Alternative Kong UI |
| **RabbitMQ Management** | http://localhost:15672 | RabbitMQ admin (guest/guest) |
| **Prometheus Metrics** | http://localhost:8001/metrics | Kong metrics |

## Security Features

- ✅ **Rate Limiting**: Prevent API abuse (100-200 req/min per service)
- ✅ **CORS**: Cross-origin request handling
- ✅ **JWT Authentication**: Token-based auth (optional, can be enabled)
- ✅ **Request Validation**: Size limits and validation
- ✅ **IP Filtering**: Whitelist/blacklist (configurable)
- ✅ **API Keys**: API key authentication (optional)

## Monitoring & Observability

### Kong Metrics
```bash
# View Prometheus metrics
curl http://localhost:8001/metrics

# Check Kong status
curl http://localhost:8001/status
```

### Service Health Checks
```bash
# All services have health endpoints
curl http://localhost:8000/api/auth/health
curl http://localhost:8000/api/inventory/health
curl http://localhost:8000/api/payment/health
```

## Configuration

### Environment Variables

Create environment files for each service:

```bash
# Authentication service
MONGODB_URL=mongodb://root@mongo_authentication:27017
RABBITMQ_URL=amqp://rabbitmq:5672
JWT_SECRET=your-secret-key
JWT_EXPIRATION=3600

# Inventory service
MONGODB_URL=mongodb://root@mongo_inventory:27017
RABBITMQ_URL=amqp://rabbitmq:5672

# Payment service
MONGODB_URL=mongodb://root@mongo_payment:27017
RABBITMQ_URL=amqp://rabbitmq:5672
STRIPE_API_KEY=your-stripe-key
```

### Kong Configuration

Kong is configured via the Admin API. See `kong-admin-api-examples.sh` for examples:

```bash
# Configure everything
bash kong-admin-api-examples.sh

# Or use make
make kong-config
```

## Scaling

### Scale Kong Gateway
```bash
docker-compose up -d --scale kong=3
```

### Scale Microservices
```bash
docker-compose up -d --scale authentication=3
docker-compose up -d --scale inventory=5
docker-compose up -d --scale payment=2
```

Kong automatically load balances across all instances!

## Testing

### Unit Tests
```bash
# Run tests in each service
cd authentication && npm test
cd inventory && npm test
cd payment && npm test
```

### Integration Tests
```bash
# Test through Kong
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Load Testing
```bash
# Test rate limiting
make rate-limit-test

# Custom load test
make load-test
```

## Structure

```
nest-ecommerce/
├── authentication/          # Authentication microservice
│   ├── src/
│   │   ├── authentication/
│   │   ├── user/
│   │   └── main.ts
│   └── package.json
├── inventory/              # Inventory microservice
│   ├── src/
│   │   ├── products/
│   │   ├── categories/
│   │   └── main.ts
│   └── package.json
├── payment/                # Payment microservice
│   ├── src/
│   │   ├── payments/
│   │   ├── transactions/
│   │   └── main.ts
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
├── kong.yml               # Kong declarative config (optional)
├── kong-admin-api-examples.sh  # Kong configuration script
├── Makefile               # Management commands
```

---

**Built with ❤️ using NestJS and Kong Gateway**

Ready to scale! 🚀




