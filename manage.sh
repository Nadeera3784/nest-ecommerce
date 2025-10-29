#!/bin/bash

set -e  

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' 

print_info() {
    echo -e "${CYAN}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

show_help() {
    echo "Kong Gateway & Microservices Management Commands"
    echo "================================================="
    echo ""
    echo "Usage: ./manage.sh [command]"
    echo ""
    echo "Kong Gateway Commands:"
    echo "  kong-up              Start Kong Gateway and its dependencies"
    echo "  kong-down            Stop Kong Gateway services"
    echo "  kong-restart         Restart Kong Gateway"
    echo "  kong-config          Configure Kong Gateway routes and services"
    echo "  kong-test            Test Kong Gateway endpoints"
    echo "  kong-logs            View Kong Gateway logs"
    echo "  kong-status          Show Kong Gateway status"
    echo "  kong-metrics         Show Kong Gateway metrics"
    echo "  kong-clean           Remove Kong Gateway and clean volumes"
    echo ""
    echo "Microservices Commands:"
    echo "  services-up          Start all services"
    echo "  services-down        Stop all services"
    echo "  services-logs        View logs from all services"
    echo "  services-ps          Show status of all services"
    echo ""
    echo "Development Commands:"
    echo "  dev-setup            Setup complete development environment"
    echo "  dev-reset            Reset development environment"
    echo ""
    echo "Database Commands:"
    echo "  db-backup            Backup Kong database"
    echo "  db-restore           Restore Kong database (requires BACKUP_FILE env var)"
    echo ""
    echo "Testing Commands:"
    echo "  load-test            Run load test (1000 requests)"
    echo "  rate-limit-test      Test rate limiting"
    echo ""
    echo "Kong Plugin Management:"
    echo "  plugin-list          List all Kong plugins"
    echo "  plugin-enable-jwt    Enable JWT plugin"
    echo "  plugin-disable       Disable a plugin (requires PLUGIN_ID env var)"
    echo ""
    echo "Service Management:"
    echo "  service-add          Add new service (requires NAME and URL env vars)"
    echo "  route-add            Add new route (requires SERVICE and PATH env vars)"
    echo ""
    echo "Quick Access:"
    echo "  admin-api            Open Kong Admin API in browser"
    echo "  admin-ui             Open Konga Admin UI in browser"
    echo "  kong-manager         Open Kong Manager in browser"
    echo ""
    echo "Monitoring:"
    echo "  monitor-setup        Setup monitoring stack"
    echo ""
}

kong_up() {
    print_info "Starting Kong Gateway..."
    docker-compose up -d kong-database
    print_info "Waiting for database to be ready..."
    sleep 5
    docker-compose up -d kong-migration
    print_info "Running migrations..."
    sleep 5
    docker-compose up -d kong konga
    print_success "Kong Gateway is starting..."
    echo ""
    print_info "Access points:"
    echo "  - Kong Proxy: http://localhost:8000"
    echo "  - Kong Admin API: http://localhost:8001"
    echo "  - Kong Manager: http://localhost:8002"
    echo "  - Konga Admin UI: http://localhost:1337"
}

kong_down() {
    print_info "Stopping Kong Gateway services..."
    docker-compose stop kong konga kong-migration
    print_success "Kong Gateway stopped"
}

kong_restart() {
    print_info "Restarting Kong Gateway..."
    docker-compose restart kong
    print_success "Kong Gateway restarted"
}

kong_config() {
    print_info "Configuring Kong Gateway..."
    bash kong-admin-api-examples.sh
    print_success "Kong Gateway configured"
}

kong_test() {
    print_info "Testing Kong endpoints..."
    echo ""
    print_info "=== Authentication Service ==="
    curl -i http://localhost:8000/api/auth/health
    echo ""
    print_info "=== Inventory Service ==="
    curl -i http://localhost:8000/api/inventory/health
    echo ""
    print_info "=== Payment Service ==="
    curl -i http://localhost:8000/api/payment/health
}

kong_logs() {
    print_info "Showing Kong Gateway logs (Ctrl+C to exit)..."
    docker logs -f kong-gateway
}

kong_status() {
    print_info "Kong Status:"
    curl -s http://localhost:8001/status | jq '.'
    echo ""
    print_info "Services:"
    curl -s http://localhost:8001/services | jq '.data[] | {name: .name, url: .host}'
    echo ""
    print_info "Routes:"
    curl -s http://localhost:8001/routes | jq '.data[] | {name: .name, paths: .paths}'
    echo ""
    print_info "Plugins:"
    curl -s http://localhost:8001/plugins | jq '.data[] | {name: .name}'
}

kong_metrics() {
    print_info "Kong Metrics:"
    curl -s http://localhost:8001/metrics
}

kong_clean() {
    print_info "Cleaning Kong Gateway..."
    docker-compose down -v kong kong-database kong-migration konga
    docker volume rm nest-ecommerce_kong_data 2>/dev/null || true
    print_success "Kong Gateway removed"
}

# Microservices Commands
services_up() {
    print_info "Starting all services..."
    docker-compose up -d
    print_success "All services started"
}

services_down() {
    print_info "Stopping all services..."
    docker-compose down
    print_success "All services stopped"
}

services_logs() {
    print_info "Showing logs from all services (Ctrl+C to exit)..."
    docker-compose logs -f
}

services_ps() {
    print_info "Service Status:"
    docker-compose ps
}

# Development 
dev_setup() {
    print_info "Setting up development environment..."
    services_up
    print_info "Waiting for services to be ready..."
    sleep 10
    kong_config
    echo ""
    print_success "Setup complete! Test with: ./manage.sh kong-test"
}

dev_reset() {
    print_warning "Resetting development environment..."
    services_down
    kong_clean
    print_success "Environment reset complete"
}

# Database 
db_backup() {
    BACKUP_FILE="kong-backup-$(date +%Y%m%d-%H%M%S).sql"
    print_info "Backing up Kong database to $BACKUP_FILE..."
    docker exec kong-database pg_dump -U kong kong > "$BACKUP_FILE"
    print_success "Database backed up to $BACKUP_FILE"
}

db_restore() {
    if [ -z "$BACKUP_FILE" ]; then
        print_error "Error: Please specify BACKUP_FILE environment variable"
        echo "Example: BACKUP_FILE=kong-backup.sql ./manage.sh db-restore"
        exit 1
    fi
    print_info "Restoring Kong database from $BACKUP_FILE..."
    cat "$BACKUP_FILE" | docker exec -i kong-database psql -U kong kong
    print_success "Database restored"
}

# Monitoring 
monitor_setup() {
    print_info "Setting up monitoring stack..."
    print_warning "TODO: Add prometheus and grafana to docker-compose"
}

# Testing 
load_test() {
    print_info "Running load test..."
    print_info "Sending 1000 requests to /api/auth/health"
    for i in $(seq 1 1000); do
        curl -s http://localhost:8000/api/auth/health > /dev/null &
    done
    wait
    print_success "Load test complete. Check metrics with: ./manage.sh kong-metrics"
}

rate_limit_test() {
    print_info "Testing rate limiting (should see 429 after 100 requests)..."
    for i in $(seq 1 105); do
        echo "Request $i:"
        curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8000/api/auth/health
    done
}

# Kong Plugin Management
plugin_list() {
    print_info "Kong Plugins:"
    curl -s http://localhost:8001/plugins | jq '.data[] | {name: .name, service: .service.name, enabled: .enabled}'
}

plugin_enable_jwt() {
    print_info "Enabling JWT plugin on authentication service..."
    curl -i -X POST http://localhost:8001/services/authentication-service/plugins \
        --data name=jwt
    echo ""
    print_success "JWT plugin enabled"
}

plugin_disable() {
    if [ -z "$PLUGIN_ID" ]; then
        print_error "Error: Please specify PLUGIN_ID environment variable"
        echo "Example: PLUGIN_ID=abc123 ./manage.sh plugin-disable"
        echo "Get plugin IDs with: ./manage.sh plugin-list"
        exit 1
    fi
    print_info "Disabling plugin $PLUGIN_ID..."
    curl -i -X DELETE "http://localhost:8001/plugins/$PLUGIN_ID"
    echo ""
    print_success "Plugin disabled"
}

# Service Management
service_add() {
    if [ -z "$NAME" ] || [ -z "$URL" ]; then
        print_error "Error: Please specify NAME and URL environment variables"
        echo "Example: NAME=new-service URL=http://new-service:3000 ./manage.sh service-add"
        exit 1
    fi
    print_info "Adding service $NAME..."
    curl -i -X POST http://localhost:8001/services \
        --data "name=$NAME" \
        --data "url=$URL"
    echo ""
    print_success "Service added"
}

route_add() {
    if [ -z "$SERVICE" ] || [ -z "$PATH" ]; then
        print_error "Error: Please specify SERVICE and PATH environment variables"
        echo "Example: SERVICE=new-service PATH=/api/new ./manage.sh route-add"
        exit 1
    fi
    print_info "Adding route to service $SERVICE..."
    curl -i -X POST "http://localhost:8001/services/$SERVICE/routes" \
        --data "paths[]=$PATH" \
        --data strip_path=true
    echo ""
    print_success "Route added"
}

# Quick Access
admin_api() {
    print_info "Opening Kong Admin API in browser..."
    open http://localhost:8001 2>/dev/null || xdg-open http://localhost:8001 2>/dev/null || echo "Visit: http://localhost:8001"
}

admin_ui() {
    print_info "Opening Konga Admin UI in browser..."
    open http://localhost:1337 2>/dev/null || xdg-open http://localhost:1337 2>/dev/null || echo "Visit: http://localhost:1337"
}

kong_manager() {
    print_info "Opening Kong Manager in browser..."
    open http://localhost:8002 2>/dev/null || xdg-open http://localhost:8002 2>/dev/null || echo "Visit: http://localhost:8002"
}

# Main script logic
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        # Kong Gateway Commands
        kong-up)
            kong_up
            ;;
        kong-down)
            kong_down
            ;;
        kong-restart)
            kong_restart
            ;;
        kong-config)
            kong_config
            ;;
        kong-test)
            kong_test
            ;;
        kong-logs)
            kong_logs
            ;;
        kong-status)
            kong_status
            ;;
        kong-metrics)
            kong_metrics
            ;;
        kong-clean)
            kong_clean
            ;;
        
        # Microservices Commands
        services-up)
            services_up
            ;;
        services-down)
            services_down
            ;;
        services-logs)
            services_logs
            ;;
        services-ps)
            services_ps
            ;;
        
        # Development Commands
        dev-setup)
            dev_setup
            ;;
        dev-reset)
            dev_reset
            ;;
        
        # Database Commands
        db-backup)
            db_backup
            ;;
        db-restore)
            db_restore
            ;;
        
        # Monitoring Commands
        monitor-setup)
            monitor_setup
            ;;
        
        # Testing Commands
        load-test)
            load_test
            ;;
        rate-limit-test)
            rate_limit_test
            ;;
        
        # Kong Plugin Management
        plugin-list)
            plugin_list
            ;;
        plugin-enable-jwt)
            plugin_enable_jwt
            ;;
        plugin-disable)
            plugin_disable
            ;;
        
        # Service Management
        service-add)
            service_add
            ;;
        route-add)
            route_add
            ;;
        
        # Quick Access
        admin-api)
            admin_api
            ;;
        admin-ui)
            admin_ui
            ;;
        kong-manager)
            kong_manager
            ;;
        
        # Help
        help|--help|-h)
            show_help
            ;;
        
        *)
            print_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"



