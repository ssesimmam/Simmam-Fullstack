#!/usr/bin/env bash
# Helper to apply a SQL migration file to a Postgres database using PGPASSWORD
# Usage: APPLY_DB_URL="..." ./scripts/apply_migration.sh supabase/migrations/20260521_safer_create_registration.sql

set -euo pipefail
if [ -z "${1-}" ]; then
  echo "Usage: $0 <path-to-sql-file>"
  exit 2
fi
SQL_FILE="$1"
if [ -z "${PGPASSWORD-}" ] && [ -z "${STAGING_DB_PASSWORD-}" ]; then
  echo "PGPASSWORD or STAGING_DB_PASSWORD must be set in environment"
  exit 2
fi
if [ -z "${PG_CONN-}" ]; then
  echo "PG_CONN (connection string) must be set in environment, e.g. postgres://user@host:5432/db"
  exit 2
fi

psql "$PG_CONN" -f "$SQL_FILE"
