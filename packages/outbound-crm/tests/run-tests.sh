#!/bin/bash
# Outbound CRM - Test Runner
#
# Usage:
#   ./tests/run-tests.sh              # Validate JSON + run E2E (if .env exists)
#   ./tests/run-tests.sh --validate   # Only validate JSON structure
#   ./tests/run-tests.sh --e2e        # Only run E2E tests (requires .env)
#   ./tests/run-tests.sh --setup      # Only setup (import + seed)
#   ./tests/run-tests.sh --cleanup    # Only cleanup test data

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

echo "==================================="
echo "  Outbound CRM Test Runner"
echo "==================================="
echo ""

MODE="${1:-all}"

# Step 1: JSON Validation (always runs unless --e2e only)
if [[ "$MODE" == "all" || "$MODE" == "--validate" ]]; then
  echo ">>> Step 1: Validating workflow JSON files..."
  echo ""
  node "$SCRIPT_DIR/validate-workflows.js"

  if [[ $? -ne 0 ]]; then
    echo ""
    echo "JSON validation failed. Fix errors before proceeding."
    exit 1
  fi
fi

# Step 2: E2E Tests (requires .env)
if [[ "$MODE" == "all" || "$MODE" == "--e2e" || "$MODE" == "--setup" || "$MODE" == "--cleanup" ]]; then
  if [[ ! -f "$PACKAGE_DIR/.env" ]]; then
    echo ""
    echo ">>> Skipping E2E tests (.env not found)"
    echo "    Copy .env.example to .env and fill in credentials to enable E2E testing."
    echo ""
    echo "    cp $PACKAGE_DIR/.env.example $PACKAGE_DIR/.env"
    echo ""

    if [[ "$MODE" == "--e2e" || "$MODE" == "--setup" ]]; then
      echo "ERROR: .env required for this mode"
      exit 1
    fi
  else
    echo ""
    echo ">>> Step 2: Running E2E tests..."
    echo ""

    E2E_ARGS=""
    case "$MODE" in
      "--setup")   E2E_ARGS="--step setup" ;;
      "--cleanup") E2E_ARGS="--step cleanup" ;;
      *)           E2E_ARGS="" ;;
    esac

    node "$SCRIPT_DIR/e2e-test.js" $E2E_ARGS
  fi
fi

echo ""
echo "==================================="
echo "  Done!"
echo "==================================="
