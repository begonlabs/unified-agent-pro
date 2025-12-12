#!/bin/bash

# Script to verify support tickets setup and debug issues
# This will check if policies exist and if admin role is properly set

set -e

echo "🔍 Verifying support tickets configuration..."

# Connect via SSH and run diagnostic queries
ssh root@37.27.20.208 << 'ENDSSH'

# Get postgres password from .env
PGPASSWORD=$(grep POSTGRES_PASSWORD /root/.env | cut -d '=' -f2)
export PGPASSWORD

echo "📋 Checking if support_tickets table exists..."
psql -U postgres -d postgres -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets');"

echo ""
echo "🔐 Checking RLS policies on support_tickets..."
psql -U postgres -d postgres -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'support_tickets';"

echo ""
echo "👤 Checking user_roles table..."
psql -U postgres -d postgres -c "SELECT ur.user_id, ur.role, au.email FROM user_roles ur JOIN auth.users au ON ur.user_id = au.id WHERE au.email = 'ernestogrz91@gmail.com';"

echo ""
echo "📊 Checking support_tickets count..."
psql -U postgres -d postgres -c "SELECT COUNT(*) as total_tickets FROM support_tickets;"

echo ""
echo "🎫 Checking recent tickets..."
psql -U postgres -d postgres -c "SELECT id, user_id, subject, status, created_at FROM support_tickets ORDER BY created_at DESC LIMIT 5;"

ENDSSH

echo ""
echo "✅ Diagnostic complete"
