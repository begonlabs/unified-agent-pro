#!/bin/bash
# Script to deploy the plan limits fix to production
# This script will apply the migration and verify the results

set -e  # Exit on error

echo "========================================="
echo "Plan Limits Fix Deployment Script"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251208000001_fix_basico_plan_limits.sql" ]; then
    echo "ERROR: Migration file not found. Please run this script from the project root."
    exit 1
fi

echo "Step 1: Applying migration to fix plan limits..."
echo "This will:"
echo "  - Fix all users with incorrect limits (basico, avanzado, pro, empresarial)"
echo "  - Enhance configure_plan_limits function with validation"
echo "  - Add database trigger to prevent future issues"
echo ""

# Apply the migration
supabase db push

echo ""
echo "Step 2: Verifying the fix..."
echo ""

# Run verification queries
echo "Checking users with paid plans and their limits:"
supabase db execute <<SQL
SELECT 
  plan_type,
  COUNT(*) as user_count,
  MIN(messages_limit) as min_msg_limit,
  MAX(messages_limit) as max_msg_limit,
  MIN(clients_limit) as min_client_limit,
  MAX(clients_limit) as max_client_limit
FROM profiles
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
GROUP BY plan_type
ORDER BY plan_type;
SQL

echo ""
echo "Checking for any remaining users with incorrect limits:"
supabase db execute <<SQL
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  has_statistics,
  crm_level
FROM profiles
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
  AND (messages_limit = 0 OR messages_limit IS NULL OR clients_limit = 0 OR clients_limit IS NULL);
SQL

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Check the output above for any remaining issues"
echo "2. Ask the affected user to refresh their dashboard"
echo "3. Verify that AI message consumption shows correct limits"
echo ""
