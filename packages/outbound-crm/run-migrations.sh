#!/bin/bash
# Run all CRM migrations against Supabase
# Usage: ./run-migrations.sh <SUPABASE_DB_URL>
# Example: ./run-migrations.sh "postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"

set -e

DB_URL="${1:-$SUPABASE_DB_URL}"

if [ -z "$DB_URL" ]; then
    echo "Error: Database URL required"
    echo "Usage: ./run-migrations.sh <SUPABASE_DB_URL>"
    echo "Or set SUPABASE_DB_URL environment variable"
    exit 1
fi

MIGRATIONS_DIR="$(dirname "$0")/migrations"

echo "Running CRM migrations..."
echo "========================="

for file in "$MIGRATIONS_DIR"/*.sql; do
    filename=$(basename "$file")
    echo "Running: $filename"
    psql "$DB_URL" -f "$file" 2>&1
    if [ $? -eq 0 ]; then
        echo "  OK: $filename"
    else
        echo "  FAILED: $filename"
        exit 1
    fi
done

echo "========================="
echo "All migrations completed successfully"
