#!/bin/bash

KONG_ADMIN_URL="http://localhost:8001"

echo "=== Kong Gateway Admin API Examples ==="
echo ""


echo "1. CREATE SERVICES"
echo "-------------------"

# Authentication 
echo "Creating Authentication Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services \
  --data name=authentication-service \
  --data url=http://authentication:3000 \
  --data protocol=http \
  --data connect_timeout=60000 \
  --data write_timeout=60000 \
  --data read_timeout=60000 \
  --data retries=3

# Inventory 
echo "Creating Inventory Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services \
  --data name=inventory-service \
  --data url=http://inventory:3000 \
  --data protocol=http \
  --data connect_timeout=60000 \
  --data write_timeout=60000 \
  --data read_timeout=60000 \
  --data retries=3

# Payment 
echo "Creating Payment Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services \
  --data name=payment-service \
  --data url=http://payment:3000 \
  --data protocol=http \
  --data connect_timeout=60000 \
  --data write_timeout=60000 \
  --data read_timeout=60000 \
  --data retries=3

# Order 
echo "Creating Order Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services \
  --data name=order-service \
  --data url=http://order:3000 \
  --data protocol=http \
  --data connect_timeout=60000 \
  --data write_timeout=60000 \
  --data read_timeout=60000 \
  --data retries=3

echo ""

echo "2. CREATE ROUTES"
echo "----------------"

# Authentication 
echo "Creating Authentication Routes..."
curl -i -X POST ${KONG_ADMIN_URL}/services/authentication-service/routes \
  --data name=auth-routes \
  --data 'paths[]=/api/auth' \
  --data strip_path=true \
  --data 'methods[]=GET' \
  --data 'methods[]=POST' \
  --data 'methods[]=PUT' \
  --data 'methods[]=DELETE' \
  --data 'methods[]=PATCH'

# Inventory 
echo "Creating Inventory Routes..."
curl -i -X POST ${KONG_ADMIN_URL}/services/inventory-service/routes \
  --data name=inventory-routes \
  --data 'paths[]=/api/inventory' \
  --data strip_path=true \
  --data 'methods[]=GET' \
  --data 'methods[]=POST' \
  --data 'methods[]=PUT' \
  --data 'methods[]=DELETE' \
  --data 'methods[]=PATCH'

# Payment 
echo "Creating Payment Routes..."
curl -i -X POST ${KONG_ADMIN_URL}/services/payment-service/routes \
  --data name=payment-routes \
  --data 'paths[]=/api/payment' \
  --data strip_path=true \
  --data 'methods[]=GET' \
  --data 'methods[]=POST' \
  --data 'methods[]=PUT' \
  --data 'methods[]=DELETE' \
  --data 'methods[]=PATCH'

# Order 
echo "Creating Order Routes..."
curl -i -X POST ${KONG_ADMIN_URL}/services/order-service/routes \
  --data name=order-routes \
  --data 'paths[]=/api/orders' \
  --data strip_path=true \
  --data 'methods[]=GET' \
  --data 'methods[]=POST' \
  --data 'methods[]=PUT' \
  --data 'methods[]=DELETE' \
  --data 'methods[]=PATCH'

echo ""


echo "3. CONFIGURE RATE LIMITING"
echo "--------------------------"

# Auth 
echo "Adding rate limiting to Authentication Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services/authentication-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.hour=1000 \
  --data config.policy=local

# Inventory 
echo "Adding rate limiting to Inventory Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services/inventory-service/plugins \
  --data name=rate-limiting \
  --data config.minute=200 \
  --data config.hour=2000 \
  --data config.policy=local

# Payment 
echo "Adding rate limiting to Payment Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services/payment-service/plugins \
  --data name=rate-limiting \
  --data config.minute=50 \
  --data config.hour=500 \
  --data config.policy=local

# Order 
echo "Adding rate limiting to Order Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services/order-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.hour=1000 \
  --data config.policy=local

echo ""

echo "4. CONFIGURE CORS"
echo "-----------------"

# Global CORS or per-service
curl -i -X POST ${KONG_ADMIN_URL}/services/authentication-service/plugins \
  --data name=cors \
  --data 'config.origins=*' \
  --data 'config.methods[]=GET' \
  --data 'config.methods[]=POST' \
  --data 'config.methods[]=PUT' \
  --data 'config.methods[]=DELETE' \
  --data 'config.methods[]=PATCH' \
  --data 'config.headers[]=Accept' \
  --data 'config.headers[]=Authorization' \
  --data 'config.headers[]=Content-Type' \
  --data config.credentials=true \
  --data config.max_age=3600

curl -i -X POST ${KONG_ADMIN_URL}/services/inventory-service/plugins \
  --data name=cors \
  --data 'config.origins=*' \
  --data config.credentials=true

curl -i -X POST ${KONG_ADMIN_URL}/services/payment-service/plugins \
  --data name=cors \
  --data 'config.origins=*' \
  --data config.credentials=true

curl -i -X POST ${KONG_ADMIN_URL}/services/order-service/plugins \
  --data name=cors \
  --data 'config.origins=*' \
  --data config.credentials=true

echo ""

echo "5. CONFIGURE PROXY CACHE (Inventory)"
echo "------------------------------------"

curl -i -X POST ${KONG_ADMIN_URL}/services/inventory-service/plugins \
  --data name=proxy-cache \
  --data config.strategy=memory \
  --data 'config.content_type[]=application/json' \
  --data config.cache_ttl=300 \
  --data config.cache_control=false \
  --data 'config.request_method[]=GET' \
  --data 'config.request_method[]=HEAD'

echo ""

echo "6. CONFIGURE REQUEST TRANSFORMER"
echo "--------------------------------"

curl -i -X POST ${KONG_ADMIN_URL}/services/authentication-service/plugins \
  --data name=request-transformer \
  --data 'config.add.headers[]=X-Service-Name:authentication'

curl -i -X POST ${KONG_ADMIN_URL}/services/inventory-service/plugins \
  --data name=request-transformer \
  --data 'config.add.headers[]=X-Service-Name:inventory'

curl -i -X POST ${KONG_ADMIN_URL}/services/payment-service/plugins \
  --data name=request-transformer \
  --data 'config.add.headers[]=X-Service-Name:payment'

curl -i -X POST ${KONG_ADMIN_URL}/services/order-service/plugins \
  --data name=request-transformer \
  --data 'config.add.headers[]=X-Service-Name:order'

echo ""

echo "7. CONFIGURE GLOBAL PLUGINS"
echo "---------------------------"

# Correlation ID
echo "Adding Correlation ID plugin..."
curl -i -X POST ${KONG_ADMIN_URL}/plugins \
  --data name=correlation-id \
  --data config.header_name=X-Correlation-ID \
  --data config.generator=uuid \
  --data config.echo_downstream=true

# Prometheus Metrics
echo "Adding Prometheus plugin..."
curl -i -X POST ${KONG_ADMIN_URL}/plugins \
  --data name=prometheus \
  --data config.per_consumer=false \
  --data config.status_code_metrics=true \
  --data config.latency_metrics=true \
  --data config.bandwidth_metrics=true \
  --data config.upstream_health_metrics=true

# Request Size Limiting (Payment)
echo "Adding request size limiting to Payment Service..."
curl -i -X POST ${KONG_ADMIN_URL}/services/payment-service/plugins \
  --data name=request-size-limiting \
  --data config.allowed_payload_size=10

echo ""

echo "8. CONFIGURE JWT AUTHENTICATION (Optional)"
echo "------------------------------------------"

echo "Creating consumer..."
curl -i -X POST ${KONG_ADMIN_URL}/consumers \
  --data username=api-client \
  --data custom_id=api-client-001

echo "Adding JWT credentials..."
curl -i -X POST ${KONG_ADMIN_URL}/consumers/api-client/jwt \
  --data key=my-api-key \
  --data algorithm=HS256 \
  --data secret=my-secret-key-change-this-in-production

# Enable JWT plugin on a service (uncomment to use)
# echo "Enabling JWT on Authentication Service..."
# curl -i -X POST ${KONG_ADMIN_URL}/services/authentication-service/plugins \
#   --data name=jwt

echo ""

echo "9. VERIFY CONFIGURATION"
echo "-----------------------"

echo "Listing all services..."
curl -s ${KONG_ADMIN_URL}/services | jq '.data[] | {name: .name, url: .host}'

echo ""
echo "Listing all routes..."
curl -s ${KONG_ADMIN_URL}/routes | jq '.data[] | {name: .name, paths: .paths}'

echo ""
echo "Listing all plugins..."
curl -s ${KONG_ADMIN_URL}/plugins | jq '.data[] | {name: .name, service: .service.name}'

echo ""

echo "10. HEALTH CHECKS"
echo "-----------------"

echo "Kong status..."
curl -s ${KONG_ADMIN_URL}/status | jq '.'

echo ""
echo "Kong information..."
curl -s ${KONG_ADMIN_URL}/ | jq '{version: .version, hostname: .hostname}'

echo ""

echo "11. TEST ENDPOINTS"
echo "------------------"

echo "Testing Authentication Service..."
curl -i http://localhost:8000/api/auth/health

echo ""
echo "Testing Inventory Service..."
curl -i http://localhost:8000/api/inventory/health

echo ""
echo "Testing Payment Service..."
curl -i http://localhost:8000/api/payment/health

echo ""
echo "Testing Order Service..."
curl -i http://localhost:8000/api/orders/health

echo ""


echo "12. ADVANCED"
echo "---------------------"

# Load Balancing 
echo "Creating upstream for load balancing..."
curl -i -X POST ${KONG_ADMIN_URL}/upstreams \
  --data name=authentication-upstream \
  --data algorithm=round-robin \
  --data hash_on=none

echo "Adding target to upstream..."
curl -i -X POST ${KONG_ADMIN_URL}/upstreams/authentication-upstream/targets \
  --data target=authentication:3000 \
  --data weight=100

# Update service to use upstream
echo "Updating service to use upstream..."
# curl -i -X PATCH ${KONG_ADMIN_URL}/services/authentication-service \
#   --data host=authentication-upstream

echo ""

# ============================================
# CLEANUP (OPTIONAL)
# ============================================

# Uncomment to delete all configuration
# echo "13. CLEANUP (DANGEROUS - DISABLED)"
# echo "----------------------------------"
# 
# echo "Deleting all plugins..."
# for plugin_id in $(curl -s ${KONG_ADMIN_URL}/plugins | jq -r '.data[].id'); do
#   curl -i -X DELETE ${KONG_ADMIN_URL}/plugins/${plugin_id}
# done
# 
# echo "Deleting all routes..."
# for route_id in $(curl -s ${KONG_ADMIN_URL}/routes | jq -r '.data[].id'); do
#   curl -i -X DELETE ${KONG_ADMIN_URL}/routes/${route_id}
# done
# 
# echo "Deleting all services..."
# for service_id in $(curl -s ${KONG_ADMIN_URL}/services | jq -r '.data[].id'); do
#   curl -i -X DELETE ${KONG_ADMIN_URL}/services/${service_id}
# done

echo ""
echo "=== Kong Configuration Complete ==="
echo ""
echo "Access Points:"
echo "  - Kong Proxy:       http://localhost:8000"
echo "  - Kong Admin API:   http://localhost:8001"
echo "  - Kong Manager:     http://localhost:8002"
echo "  - Konga Admin UI:   http://localhost:1337"
echo "  - Prometheus Metrics: http://localhost:8001/metrics"
echo ""
echo "Test your APIs:"
echo "  curl http://localhost:8000/api/auth/health"
echo "  curl http://localhost:8000/api/inventory/health"
echo "  curl http://localhost:8000/api/payment/health"
echo "  curl http://localhost:8000/api/orders/health"
echo ""





