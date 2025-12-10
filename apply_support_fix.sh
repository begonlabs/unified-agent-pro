#!/bin/bash

# Script to apply support tickets admin access fix migration
# This script connects to the production server and applies the SQL migration

set -e

echo "🚀 Applying support tickets admin access fix..."

# Migration file
MIGRATION_FILE="supabase/migrations/20251210000001_fix_support_tickets_admin_access.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file found: $MIGRATION_FILE"

# Apply migration via SSH
echo "🔧 Connecting to production server..."

# Read the migration file and execute it via SSH
ssh root@37.27.20.208 "PGPASSWORD=\$(grep POSTGRES_PASSWORD /root/.env | cut -d '=' -f2) psql -U postgres -d postgres -c \"$(cat $MIGRATION_FILE)\""

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo "🎯 Admins should now be able to view all support tickets"
else
    echo "❌ Migration failed"
    exit 1
fi
