#!/bin/bash

# Script to apply profile fields update
# This script connects to the production server and applies the SQL migration

set -e

echo "🚀 Applying profile fields update..."

# Migration file
MIGRATION_FILE="sql/add_profile_fields.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file found: $MIGRATION_FILE"

# Apply migration via SSH
echo "🔧 Connecting to production server..."

# Read the migration file and execute it via SSH
# We use cats to pipe the content to avoid escaping issues with complex SQL
cat "$MIGRATION_FILE" | ssh root@37.27.20.208 "PGPASSWORD=\$(grep POSTGRES_PASSWORD /root/.env | cut -d '=' -f2) psql -U postgres -d postgres"

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
else
    echo "❌ Migration failed"
    exit 1
fi
