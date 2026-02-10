#!/bin/bash
# Outbound CRM - Automated Deploy Script
#
# Deploys all components:
#   1. SQL migrations to Supabase
#   2. Edge Functions to Supabase
#   3. N8N workflows via API
#   4. Replaces credential placeholders
#
# Prerequisites:
#   - .env file with all credentials
#   - supabase CLI installed (for edge functions)
#   - Node.js 18+
#
# Usage:
#   ./scripts/deploy.sh              # Deploy all
#   ./scripts/deploy.sh migrations   # Only migrations
#   ./scripts/deploy.sh functions    # Only edge functions
#   ./scripts/deploy.sh workflows    # Only N8N workflows
#   ./scripts/deploy.sh verify       # Only verify connections

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PACKAGE_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Load .env
load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    log_error ".env file not found at $ENV_FILE"
    echo "Copy .env.example to .env and fill in credentials:"
    echo "  cp $PACKAGE_DIR/.env.example $PACKAGE_DIR/.env"
    exit 1
  fi

  set -a
  source "$ENV_FILE"
  set +a
  log_ok "Loaded .env configuration"
}

# Verify connections
verify_connections() {
  log_info "Verifying connections..."

  # Check Supabase
  if [[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
      "$SUPABASE_URL/rest/v1/" 2>/dev/null || echo "000")

    if [[ "$HTTP_CODE" == "200" ]]; then
      log_ok "Supabase: Connected ($SUPABASE_URL)"
    else
      log_error "Supabase: Connection failed (HTTP $HTTP_CODE)"
      return 1
    fi
  else
    log_error "Supabase: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    return 1
  fi

  # Check N8N
  if [[ -n "${N8N_URL:-}" && -n "${N8N_API_KEY:-}" ]]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      "$N8N_URL/api/v1/workflows?limit=1" 2>/dev/null || echo "000")

    if [[ "$HTTP_CODE" == "200" ]]; then
      log_ok "N8N: Connected ($N8N_URL)"
    else
      log_error "N8N: Connection failed (HTTP $HTTP_CODE)"
      return 1
    fi
  else
    log_warn "N8N: N8N_URL or N8N_API_KEY not set (skipping workflow deploy)"
  fi

  # Check Resend
  if [[ -n "${RESEND_API_KEY:-}" ]]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      "https://api.resend.com/domains" 2>/dev/null || echo "000")

    if [[ "$HTTP_CODE" == "200" ]]; then
      log_ok "Resend: API key valid"
    else
      log_warn "Resend: API key check returned HTTP $HTTP_CODE"
    fi
  else
    log_warn "Resend: RESEND_API_KEY not set"
  fi

  echo ""
}

# Deploy migrations
deploy_migrations() {
  log_info "Deploying SQL migrations..."

  MIGRATION_DIR="$PACKAGE_DIR/migrations"
  MIGRATIONS=($(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort))

  if [[ ${#MIGRATIONS[@]} -eq 0 ]]; then
    log_error "No migration files found in $MIGRATION_DIR"
    return 1
  fi

  # Use Supabase REST API to execute SQL
  # Note: For production, use supabase CLI or direct psql connection
  if command -v psql &> /dev/null && [[ -n "${DATABASE_URL:-}" ]]; then
    for migration in "${MIGRATIONS[@]}"; do
      filename=$(basename "$migration")
      log_info "Running: $filename"
      psql "$DATABASE_URL" -f "$migration" 2>&1 | while read line; do
        echo "  $line"
      done
      log_ok "$filename"
    done
  elif command -v supabase &> /dev/null; then
    log_info "Using Supabase CLI for migrations..."
    for migration in "${MIGRATIONS[@]}"; do
      filename=$(basename "$migration")
      log_info "Running: $filename"
      supabase db execute --file "$migration" 2>&1 | while read line; do
        echo "  $line"
      done
      log_ok "$filename"
    done
  else
    log_warn "Neither psql nor supabase CLI found."
    log_warn "Run migrations manually:"
    echo ""
    echo "  Option A (psql):"
    echo "    export DATABASE_URL='postgresql://...'"
    echo "    bash $PACKAGE_DIR/run-migrations.sh \$DATABASE_URL"
    echo ""
    echo "  Option B (Supabase Dashboard):"
    echo "    Copy each .sql file content into SQL Editor at:"
    echo "    $SUPABASE_URL -> SQL Editor -> New query"
    echo ""
    return 1
  fi

  log_ok "All ${#MIGRATIONS[@]} migrations deployed"
  echo ""
}

# Deploy edge functions
deploy_edge_functions() {
  log_info "Deploying Edge Functions..."

  if ! command -v supabase &> /dev/null; then
    log_warn "Supabase CLI not installed. Install with:"
    echo "  npm install -g supabase"
    echo ""
    echo "Then deploy manually:"
    echo "  cd $PACKAGE_DIR"
    echo "  supabase functions deploy track"
    echo "  supabase functions deploy unsubscribe"
    return 1
  fi

  FUNCTIONS_DIR="$PACKAGE_DIR/edge-functions"

  for func_dir in "$FUNCTIONS_DIR"/*/; do
    func_name=$(basename "$func_dir")
    log_info "Deploying function: $func_name"

    supabase functions deploy "$func_name" \
      --project-ref "${SUPABASE_PROJECT_REF:-}" \
      2>&1 | while read line; do
        echo "  $line"
      done

    # Set secrets for the function
    if [[ "$func_name" == "track" && -n "${N8N_TRACKING_WEBHOOK_URL:-}" ]]; then
      echo "N8N_TRACKING_WEBHOOK_URL=$N8N_TRACKING_WEBHOOK_URL" | \
        supabase secrets set --project-ref "${SUPABASE_PROJECT_REF:-}" 2>/dev/null || true
    fi

    log_ok "Function $func_name deployed"
  done

  echo ""
}

# Deploy N8N workflows
deploy_workflows() {
  log_info "Deploying N8N workflows..."

  if [[ -z "${N8N_URL:-}" || -z "${N8N_API_KEY:-}" ]]; then
    log_error "N8N_URL and N8N_API_KEY required for workflow deployment"
    return 1
  fi

  WORKFLOWS_DIR="$PACKAGE_DIR/n8n-workflows"
  WORKFLOWS=($(ls "$WORKFLOWS_DIR"/*.json 2>/dev/null | sort))

  for wf_file in "${WORKFLOWS[@]}"; do
    filename=$(basename "$wf_file")

    # Read and replace placeholders
    WF_JSON=$(cat "$wf_file")

    # Replace all CONFIGURE_ placeholders
    WF_JSON=$(echo "$WF_JSON" | sed \
      -e "s|CONFIGURE_SUPABASE_CREDENTIAL_ID|${SUPABASE_CREDENTIAL_ID:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_RESEND_CREDENTIAL_ID|${RESEND_CREDENTIAL_ID:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_SUPABASE_URL|${SUPABASE_URL:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_HUNTER_API_KEY|${HUNTER_API_KEY:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_VALIDATION_API_KEY|${VALIDATION_API_KEY:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_NOTIFICATION_WEBHOOK_URL|${NOTIFICATION_WEBHOOK_URL:-NEEDS_CONFIG}|g" \
      -e "s|CONFIGURE_IMAP_SETTINGS|${IMAP_SETTINGS:-NEEDS_CONFIG}|g" \
    )

    log_info "Importing: $filename"

    RESULT=$(curl -s -w "\n%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "X-N8N-API-KEY: $N8N_API_KEY" \
      -d "$WF_JSON" \
      "$N8N_URL/api/v1/workflows" 2>/dev/null)

    HTTP_CODE=$(echo "$RESULT" | tail -1)
    BODY=$(echo "$RESULT" | head -n -1)

    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
      WF_ID=$(echo "$BODY" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).id))" 2>/dev/null || echo "unknown")
      log_ok "$filename (id: $WF_ID)"

      # Activate workflow
      curl -s -o /dev/null \
        -X PATCH \
        -H "Content-Type: application/json" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -d '{"active": true}' \
        "$N8N_URL/api/v1/workflows/$WF_ID" 2>/dev/null

      log_ok "  Activated: $WF_ID"
    else
      log_error "$filename: HTTP $HTTP_CODE"
      echo "  $BODY" | head -c 200
      echo ""
    fi
  done

  echo ""
}

# Main
main() {
  echo "==================================="
  echo "  Outbound CRM Deploy"
  echo "==================================="
  echo ""

  load_env

  MODE="${1:-all}"

  case "$MODE" in
    all)
      verify_connections
      deploy_migrations
      deploy_edge_functions
      deploy_workflows
      ;;
    verify)
      verify_connections
      ;;
    migrations)
      deploy_migrations
      ;;
    functions)
      deploy_edge_functions
      ;;
    workflows)
      deploy_workflows
      ;;
    *)
      echo "Usage: $0 [all|verify|migrations|functions|workflows]"
      exit 1
      ;;
  esac

  echo "==================================="
  echo -e "  ${GREEN}Deploy complete!${NC}"
  echo "==================================="
}

main "$@"
