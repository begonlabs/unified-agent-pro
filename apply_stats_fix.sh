#!/bin/bash

# Apply general stats fix migration
echo "Applying general stats fix migration..."
docker exec -i supabase-db psql -U postgres -d postgres -f - < ./supabase/migrations/20251212000001_fix_general_stats.sql

echo "Migration applied. Verifying function existence..."
docker exec -i supabase-db psql -U postgres -d postgres -c "SELECT proname FROM pg_proc WHERE proname = 'get_general_stats';"
