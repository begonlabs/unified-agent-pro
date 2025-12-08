-- Quick verification queries for Plan Limits Fix
-- Run these queries in Supabase SQL Editor to verify the fix

-- Query 1: Check all users with paid plans and their current limits
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  messages_sent_this_month,
  has_statistics,
  crm_level,
  created_at
FROM profiles
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
ORDER BY created_at DESC;

-- Query 2: Summary by plan type
SELECT 
  plan_type,
  COUNT(*) as total_users,
  AVG(messages_limit) as avg_msg_limit,
  AVG(clients_limit) as avg_client_limit,
  COUNT(CASE WHEN messages_limit = 0 OR messages_limit IS NULL THEN 1 END) as users_with_zero_limits
FROM profiles
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
GROUP BY plan_type
ORDER BY plan_type;

-- Query 3: Find any users with incorrect limits (should return 0 rows after fix)
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  'INCORRECT LIMITS' as issue
FROM profiles
WHERE plan_type = 'basico' AND (messages_limit != 10000 OR clients_limit != 200)
UNION ALL
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  'INCORRECT LIMITS' as issue
FROM profiles
WHERE plan_type = 'avanzado' AND (messages_limit != 30000 OR clients_limit != 600)
UNION ALL
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  'INCORRECT LIMITS' as issue
FROM profiles
WHERE plan_type = 'pro' AND (messages_limit != 70000 OR clients_limit != 2000)
UNION ALL
SELECT 
  user_id,
  email,
  plan_type,
  messages_limit,
  clients_limit,
  'INCORRECT LIMITS' as issue
FROM profiles
WHERE plan_type = 'empresarial' AND (messages_limit != 100000 OR clients_limit != 3000);

-- Query 4: Test the configure_plan_limits function (replace USER_ID with actual user_id)
-- SELECT configure_plan_limits('USER_ID'::uuid, 'basico');

-- Query 5: Check recent payments and their associated user limits
SELECT 
  p.id as payment_id,
  p.user_id,
  p.plan_type as payment_plan,
  p.status as payment_status,
  p.created_at as payment_date,
  pr.plan_type as profile_plan,
  pr.messages_limit,
  pr.clients_limit,
  pr.payment_status as profile_payment_status
FROM payments p
LEFT JOIN profiles pr ON p.user_id = pr.user_id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;
