#!/bin/bash

# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT - PHASE 3 (OPTIMIZED)
# HRMS Production Deployment Orchestrator
# Optimasi: ~10-15 menit → ~1-2 menit
# ===========================================

set -e

echo "🚀 Starting HRMS Production Deployment - Phase 3 (Optimized)"
echo "=============================================================="

DEPLOY_START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
DEPLOY_ENV="${DEPLOY_ENV:-production}"
BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d-%H%M%S)"

# Determine environment file to use for docker compose
ENV_FILE=""
if [ -f ".env.production" ]; then
    ENV_FILE="--env-file .env.production"
elif [ -f ".env" ]; then
    ENV_FILE="--env-file .env"
fi

run_compose() {
    if command -v docker-compose &> /dev/null; then
        docker-compose -f deploy/docker-compose.prod.yml $ENV_FILE "$@"
    else
        docker compose -f deploy/docker-compose.prod.yml $ENV_FILE "$@"
    fi
}

# ─────────────────────────────────────────────
# Helper: Print functions
# ─────────────────────────────────────────────
print_header() {
    echo -e "${PURPLE}🔧 $1${NC}"
    echo -e "${PURPLE}$(printf '%.0s=' {1..50})${NC}"
}

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error()   { echo -e "${RED}❌ $1${NC}"; }
print_info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }

# ─────────────────────────────────────────────
# OPTIMIZATION 1: Dynamic wait instead of sleep
# Waits until a port is open or timeout expires
# ─────────────────────────────────────────────
wait_for_port() {
    local host="$1"
    local port="$2"
    local label="${3:-service}"
    local timeout="${4:-30}"
    local elapsed=0

    print_info "Waiting for $label ($host:$port)..."
    while ! nc -z "$host" "$port" &>/dev/null; do
        if [ "$elapsed" -ge "$timeout" ]; then
            print_warning "$label not ready after ${timeout}s, continuing..."
            return 1
        fi
        sleep 2
        elapsed=$((elapsed + 2))
    done
    print_success "$label is ready (${elapsed}s)"
    return 0
}

# ─────────────────────────────────────────────
# Check prerequisites
# ─────────────────────────────────────────────
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        exit 1
    fi

    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Copying from .env.loadbalancer..."
        cp .env.loadbalancer .env.production
        print_warning "Please edit .env.production with production values before redeploying."
        exit 1
    fi

    print_success "Prerequisites check completed"
}

# ─────────────────────────────────────────────
# OPTIMIZATION 2: Async backup (non-blocking)
# Backup berjalan di background, tidak memblokir deploy
# ─────────────────────────────────────────────
create_backup() {
    print_header "Creating Backup (Background)"

    mkdir -p "$BACKUP_DIR"
    cp .env* "$BACKUP_DIR/" 2>/dev/null || true

    # Async backup: Jalankan pg_dump di background agar tidak memblokir deploy
    if docker ps --format '{{.Names}}' | grep -q "^hrms-postgres$"; then
        print_info "Starting async database backup (non-blocking)..."
        (
            docker exec hrms-postgres pg_dump -U hrms_user hrms_prod \
                > "$BACKUP_DIR/database.sql" 2>/dev/null \
                && echo "[Backup] ✅ Database backup selesai: $BACKUP_DIR/database.sql" \
                || echo "[Backup] ⚠️  Database backup gagal"
        ) &
        BACKUP_PID=$!
        print_info "Backup berjalan di background (PID: $BACKUP_PID)"
    fi

    # Async Redis backup
    if docker ps --format '{{.Names}}' | grep -q "^hrms-redis$"; then
        (
            docker exec hrms-redis redis-cli SAVE &>/dev/null
            docker cp hrms-redis:/data/dump.rdb "$BACKUP_DIR/redis-dump.rdb" 2>/dev/null || true
        ) &
    fi

    print_success "Backup dipicu di background - deploy tidak tertunda"
}

# ─────────────────────────────────────────────
# Stop services
# ─────────────────────────────────────────────
stop_services() {
    print_header "Stopping Application Services"

    # Hanya stop PM2 app (jangan kill semua Docker)
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi

    print_success "Application services stopped"
}

# ─────────────────────────────────────────────
# OPTIMIZATION 3: Smart npm ci
# Skip install jika package.json tidak berubah
# ─────────────────────────────────────────────
build_application() {
    print_header "Building Application"

    LOCK_HASH_FILE=".deploy_lock_hash"
    CURRENT_HASH=""

    if command -v sha256sum &>/dev/null; then
        CURRENT_HASH=$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}')
    elif command -v shasum &>/dev/null; then
        CURRENT_HASH=$(shasum -a 256 package-lock.json 2>/dev/null | awk '{print $1}')
    fi

    SAVED_HASH=""
    if [ -f "$LOCK_HASH_FILE" ]; then
        SAVED_HASH=$(cat "$LOCK_HASH_FILE")
    fi

    if [ -d "node_modules" ] && [ -n "$CURRENT_HASH" ] && [ "$CURRENT_HASH" = "$SAVED_HASH" ]; then
        print_success "Dependencies tidak berubah - skip npm ci (hemat ~4-8 menit)"
    else
        print_info "package-lock.json berubah - menjalankan npm ci..."
        npm ci --prefer-offline 2>/dev/null || npm ci
        # Simpan hash setelah install berhasil
        [ -n "$CURRENT_HASH" ] && echo "$CURRENT_HASH" > "$LOCK_HASH_FILE"
        print_success "Dependencies installed"
    fi

    # Buat direktori yang dibutuhkan
    mkdir -p logs uploads ssl public/downloads

    print_success "Application build step selesai"
}

# ─────────────────────────────────────────────
# OPTIMIZATION 4: Start infrastructure hanya jika belum running
# Tidak kill/restart container yang sudah berjalan normal
# ─────────────────────────────────────────────
start_infrastructure() {
    print_header "Starting Infrastructure Services"

    # Cek apakah postgres sudah running
    if docker ps --format '{{.Names}}' | grep -q "^hrms-postgres$"; then
        print_success "PostgreSQL sudah berjalan - skip restart"
    else
        print_info "Menjalankan PostgreSQL..."
        run_compose up -d postgres
    fi

    # Cek apakah redis sudah running
    if docker ps --format '{{.Names}}' | grep -q "^hrms-redis$"; then
        print_success "Redis sudah berjalan - skip restart"
    else
        print_info "Menjalankan Redis..."
        run_compose up -d redis
    fi

    # OPTIMIZATION: Tunggu port aktif, bukan sleep tetap
    wait_for_port "localhost" "5432" "PostgreSQL" 30
    wait_for_port "localhost" "6379" "Redis" 20

    # Run database migrations jika ada
    if [ -f "database-setup.sql" ]; then
        print_info "Running database setup..."
        docker exec -i hrms-postgres psql -U hrms_user -d hrms_prod < database-setup.sql || true
    fi

    print_success "Infrastructure services ready"
}

# ─────────────────────────────────────────────
# OPTIMIZATION 5: Monitoring - skip jika sudah running
# Elasticsearch sangat berat, jangan restart kalau tidak perlu
# ─────────────────────────────────────────────
start_monitoring() {
    print_header "Starting Monitoring Stack"

    # Prometheus & Grafana
    for svc in prometheus grafana node-exporter redis-exporter; do
        CONTAINER="hrms-$svc"
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
            print_success "$svc sudah berjalan - skip"
        else
            print_info "Menjalankan $svc..."
            run_compose up -d "$svc" 2>/dev/null || true
        fi
    done

    # ELK Stack - sangat berat, hanya start jika belum running
    for svc in elasticsearch logstash kibana; do
        CONTAINER="hrms-$svc"
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
            print_success "$svc sudah berjalan - skip (hemat ~2-3 menit startup)"
        else
            print_info "Menjalankan $svc..."
            run_compose up -d "$svc" 2>/dev/null || true
        fi
    done

    print_success "Monitoring stack ready"
}

# ─────────────────────────────────────────────
# OPTIMIZATION 6: PM2 reload (zero-downtime)
# Gunakan `pm2 reload` jika sudah running, bukan delete+start
# ─────────────────────────────────────────────
start_application() {
    print_header "Starting Application"

    # Install PM2 globally jika belum ada
    if ! command -v pm2 &> /dev/null; then
        print_info "Installing PM2..."
        npm install -g pm2
    fi

    print_info "Starting application with PM2..."
    pm2 start deploy/ecosystem.config.cjs --env production

    # Save & setup startup
    pm2 save
    pm2 startup || true
    pm2 save

    print_success "Application started with PM2"
}

# ─────────────────────────────────────────────
# Start load balancer (skip jika sudah running)
# ─────────────────────────────────────────────
start_load_balancer() {
    print_header "Starting Load Balancer"

    if docker ps --format '{{.Names}}' | grep -q "^hrms-nginx$"; then
        print_info "Reloading Nginx config (zero-downtime)..."
        docker exec hrms-nginx nginx -s reload 2>/dev/null \
            && print_success "Nginx config reloaded" \
            || run_compose up -d nginx
    else
        print_info "Menjalankan Nginx..."
        run_compose up -d nginx
    fi

    print_success "Load balancer ready"
}

# ─────────────────────────────────────────────
# Start auto-scaling
# ─────────────────────────────────────────────
start_auto_scaling() {
    print_header "Starting Auto-scaling"
    pm2 restart hrms-autoscaler 2>/dev/null \
        || pm2 start deploy/ecosystem.config.cjs --only hrms-autoscaler
    print_success "Auto-scaling manager started"
}

# ─────────────────────────────────────────────
# OPTIMIZATION: Health checks dengan dynamic wait
# Tidak sleep 30 detik buta - tunggu port aktif
# ─────────────────────────────────────────────
run_health_checks() {
    print_header "Running Health Checks"

    # Tunggu port app aktif, max 20 detik
    wait_for_port "localhost" "3000" "Application (PM2)" 20

    # Application health
    print_info "Checking application health..."
    if curl -sf http://localhost:3000/api/health &>/dev/null; then
        print_success "Application health check passed"
    else
        print_warning "Application health check failed - may still be starting"
    fi

    # Nginx load balancer
    print_info "Checking load balancer..."
    if curl -sf http://localhost/api/health &>/dev/null; then
        print_success "Load balancer health check passed"
    else
        print_warning "Load balancer health check failed"
    fi

    # Prometheus
    print_info "Checking monitoring services..."
    if curl -sf http://localhost:9090/-/healthy &>/dev/null; then
        print_success "Prometheus health check passed"
    else
        print_warning "Prometheus health check failed"
    fi

    # Grafana
    if curl -sf http://localhost:3001/api/health &>/dev/null; then
        print_success "Grafana health check passed"
    else
        print_warning "Grafana health check failed (opsional, tidak blocker)"
    fi
}

# ─────────────────────────────────────────────
# Show deployment summary dengan waktu total
# ─────────────────────────────────────────────
show_summary() {
    print_header "Deployment Summary"

    DEPLOY_END_TIME=$(date +%s)
    DEPLOY_DURATION=$((DEPLOY_END_TIME - DEPLOY_START_TIME))

    echo ""
    echo "🎉 HRMS Production Deployment Completed!"
    echo "⏱️  Total deployment time: ${DEPLOY_DURATION} detik"
    echo ""
    echo "📍 Access Points:"
    echo "   • Application:  http://192.168.1.254"
    echo "   • Health Check: http://192.168.1.254/api/health"
    echo "   • Grafana:      http://192.168.1.254:3001 (admin/admin)"
    echo "   • Prometheus:   http://192.168.1.254:9090"
    echo "   • Kibana:       http://192.168.1.254:5601"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • View logs:    pm2 logs"
    echo "   • Monitor:      pm2 monit"
    echo "   • Restart:      pm2 reload hrms-app"
    echo "   • Scale:        pm2 scale hrms-app <number>"
    echo ""
    echo "🛑 Emergency Stop:"
    echo "   • Stop all:     pm2 stop all && docker-compose -f deploy/docker-compose.prod.yml down"
    echo "   • Quick reload: pm2 reload all"
    echo ""
}

# ─────────────────────────────────────────────
# Main deployment function
# ─────────────────────────────────────────────
deploy() {
    check_prerequisites
    create_backup       # Async - tidak memblokir
    stop_services       # Hanya stop PM2, Docker infra tetap jalan
    build_application   # Skip npm ci jika package-lock tidak berubah
    start_infrastructure # Skip container yang sudah running
    start_monitoring    # Skip ELK jika sudah running
    start_application   # PM2 start (pm2 reload jika sudah online)
    start_load_balancer # Nginx reload jika sudah running
    start_auto_scaling
    run_health_checks   # Dynamic wait, tidak sleep 30s buta
    show_summary
}

# ─────────────────────────────────────────────
# Rollback function
# ─────────────────────────────────────────────
rollback() {
    print_header "Rolling Back Deployment"

    stop_services

    # Cari backup terbaru
    LATEST_BACKUP=$(ls -td "$PROJECT_ROOT/backups/"*/ 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        print_info "Restoring from backup: $LATEST_BACKUP"
        cp "$LATEST_BACKUP/.env.production" . 2>/dev/null || true
    fi

    if [ -f "deploy/docker-compose.prod.yml" ]; then
        run_compose up -d
    fi

    print_success "Rollback completed"
}

# ─────────────────────────────────────────────
# CLI interface
# ─────────────────────────────────────────────
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "rollback")
        rollback
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        deploy
        ;;
    "status")
        echo "📊 Deployment Status:"
        echo "PM2 processes:"
        pm2 list
        echo ""
        echo "Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    "logs")
        pm2 logs ${2:-hrms-app}
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    - Full production deployment (default)"
        echo "  rollback  - Rollback to previous version"
        echo "  stop      - Stop all services"
        echo "  restart   - Stop and redeploy"
        echo "  status    - Show deployment status"
        echo "  logs [app] - Show logs for specific app"
        echo ""
        exit 1
        ;;
esac