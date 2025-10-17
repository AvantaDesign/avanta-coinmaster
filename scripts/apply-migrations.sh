#!/bin/bash

# Script to apply database migrations to production
# This script will run all pending migrations

echo "Starting database migration process..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler is not installed. Please install it first."
    exit 1
fi

# Apply migration 010
echo "Applying migration 010: Fix Database Schema Issues..."
wrangler d1 execute avanta-coinmaster-db --file=migrations/010_fix_database_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration 010 applied successfully"
else
    echo "❌ Migration 010 failed"
    exit 1
fi

echo "🎉 All migrations applied successfully!"
echo "Database schema is now up to date."
