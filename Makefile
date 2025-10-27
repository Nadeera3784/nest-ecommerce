.PHONY: help kong-up kong-down kong-config kong-test kong-logs kong-clean services-up services-down

help:
	@echo "Kong Gateway Management Commands"
	@echo "================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Kong Gateway Commands
kong-up: 
	docker-compose up -d kong-database
	@echo "Waiting for database to be ready..."
	@sleep 5
	docker-compose up -d kong-migration
	@echo "Running migrations..."
	@sleep 5
	docker-compose up -d kong konga
	@echo "Kong Gateway is starting..."
	@echo "Access points:"
	@echo "  - Kong Proxy: http://localhost:8000"
	@echo "  - Kong Admin API: http://localhost:8001"
	@echo "  - Kong Manager: http://localhost:8002"
	@echo "  - Konga Admin UI: http://localhost:1337"

kong-down: 
	docker-compose stop kong konga kong-migration

kong-restart: 
	docker-compose restart kong

kong-config: 
	@echo "Configuring Kong Gateway..."
	@bash kong-admin-api-examples.sh

kong-test: 
	@echo "Testing Kong endpoints..."
	@echo "\n=== Authentication Service ==="
	curl -i http://localhost:8000/api/auth/health
	@echo "\n=== Inventory Service ==="
	curl -i http://localhost:8000/api/inventory/health
	@echo "\n=== Payment Service ==="
	curl -i http://localhost:8000/api/payment/health

kong-logs: 
	docker logs -f kong-gateway

kong-status: 
	@echo "Kong Status:"
	@curl -s http://localhost:8001/status | jq '.'
	@echo "\nServices:"
	@curl -s http://localhost:8001/services | jq '.data[] | {name: .name, url: .host}'
	@echo "\nRoutes:"
	@curl -s http://localhost:8001/routes | jq '.data[] | {name: .name, paths: .paths}'
	@echo "\nPlugins:"
	@curl -s http://localhost:8001/plugins | jq '.data[] | {name: .name}'

kong-metrics: 
	@curl -s http://localhost:8001/metrics

kong-clean: 
	docker-compose down -v kong kong-database kong-migration konga
	docker volume rm nest-ecommerce_kong_data 2>/dev/null || true
	@echo "Kong Gateway removed"

# Microservices Commands
services-up: 
	docker-compose up -d

services-down:
	docker-compose down

services-logs:
	docker-compose logs -f

services-ps:
	docker-compose ps

# Development Commands
dev-setup:
	@echo "Setting up development environment..."
	make services-up
	@echo "Waiting for services to be ready..."
	@sleep 10
	make kong-config
	@echo "\nSetup complete! Test with: make kong-test"

dev-reset: 
	make services-down
	make kong-clean
	docker volume prune -f
	@echo "Environment reset complete"

# Database Commands
db-backup: 
	docker exec kong-database pg_dump -U kong kong > kong-backup-$$(date +%Y%m%d-%H%M%S).sql
	@echo "Database backed up"

db-restore: ## Restore Kong database (requires BACKUP_FILE variable)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Error: Please specify BACKUP_FILE=<path>"; \
		exit 1; \
	fi
	cat $(BACKUP_FILE) | docker exec -i kong-database psql -U kong kong
	@echo "Database restored"

# Monitoring Commands
monitor-setup: 
	@echo "Setting up monitoring stack..."
	@echo "TODO: Add prometheus and grafana to docker-compose"

# Testing Commands
load-test:
	@echo "Running load test..."
	@echo "Sending 1000 requests to /api/auth/health"
	@for i in $$(seq 1 1000); do \
		curl -s http://localhost:8000/api/auth/health > /dev/null & \
	done
	@wait
	@echo "Load test complete. Check metrics with: make kong-metrics"

rate-limit-test: 
	@echo "Testing rate limiting (should see 429 after 100 requests)..."
	@for i in $$(seq 1 105); do \
		echo "Request $$i:"; \
		curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8000/api/auth/health; \
	done

# Kong Plugin Management
plugin-list:
	@curl -s http://localhost:8001/plugins | jq '.data[] | {name: .name, service: .service.name, enabled: .enabled}'

plugin-enable-jwt:
	@echo "Enabling JWT plugin on authentication service..."
	@curl -i -X POST http://localhost:8001/services/authentication-service/plugins \
		--data name=jwt
	@echo "JWT plugin enabled"

plugin-disable: ## Disable a plugin (requires PLUGIN_ID variable)
	@if [ -z "$(PLUGIN_ID)" ]; then \
		echo "Error: Please specify PLUGIN_ID=<id>"; \
		echo "Get plugin IDs with: make plugin-list"; \
		exit 1; \
	fi
	@curl -i -X DELETE http://localhost:8001/plugins/$(PLUGIN_ID)
	@echo "Plugin disabled"

# Service Management
service-add:
	@if [ -z "$(NAME)" ] || [ -z "$(URL)" ]; then \
		echo "Error: Please specify NAME=<name> and URL=<url>"; \
		echo "Example: make service-add NAME=new-service URL=http://new-service:3000"; \
		exit 1; \
	fi
	@curl -i -X POST http://localhost:8001/services \
		--data name=$(NAME) \
		--data url=$(URL)
	@echo "Service added"

route-add:
	@if [ -z "$(SERVICE)" ] || [ -z "$(PATH)" ]; then \
		echo "Error: Please specify SERVICE=<name> and PATH=<path>"; \
		echo "Example: make route-add SERVICE=new-service PATH=/api/new"; \
		exit 1; \
	fi
	@curl -i -X POST http://localhost:8001/services/$(SERVICE)/routes \
		--data 'paths[]=$(PATH)' \
		--data strip_path=true
	@echo "Route added"

# Quick Access
admin-api: ## Open Kong Admin API in browser
	@open http://localhost:8001 || xdg-open http://localhost:8001 || echo "Visit: http://localhost:8001"

admin-ui: ## Open Konga Admin UI in browser
	@open http://localhost:1337 || xdg-open http://localhost:1337 || echo "Visit: http://localhost:1337"

kong-manager: ## Open Kong Manager in browser
	@open http://localhost:8002 || xdg-open http://localhost:8002 || echo "Visit: http://localhost:8002"

