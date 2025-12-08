-- Migration: Fix Plan Básico users with incorrect message limits
-- Created: 2025-12-08
-- Description: Backfills ALL users with incorrect limits and adds safeguards to prevent future issues

-- Step 1: Log affected users before fix
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM profiles
  WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial') 
    AND (messages_limit = 0 OR messages_limit IS NULL OR clients_limit = 0 OR clients_limit IS NULL);
  
  RAISE NOTICE 'Found % users with paid plans and incorrect limits', affected_count;
END $$;

-- Step 2: Fix ALL users with incorrect limits based on their plan type
UPDATE profiles
SET 
  messages_limit = CASE plan_type
    WHEN 'basico' THEN 10000
    WHEN 'avanzado' THEN 30000
    WHEN 'pro' THEN 70000
    WHEN 'empresarial' THEN 100000
    WHEN 'free' THEN 999999
    ELSE 0
  END,
  clients_limit = CASE plan_type
    WHEN 'basico' THEN 200
    WHEN 'avanzado' THEN 600
    WHEN 'pro' THEN 2000
    WHEN 'empresarial' THEN 3000
    WHEN 'free' THEN 999999
    ELSE 0
  END,
  has_statistics = CASE plan_type
    WHEN 'avanzado' THEN true
    WHEN 'pro' THEN true
    WHEN 'empresarial' THEN true
    ELSE false
  END,
  crm_level = CASE plan_type
    WHEN 'basico' THEN 'basic'
    WHEN 'avanzado' THEN 'complete'
    WHEN 'pro' THEN 'complete'
    WHEN 'empresarial' THEN 'complete'
    WHEN 'free' THEN 'basic'
    ELSE 'none'
  END,
  support_levels = CASE plan_type
    WHEN 'pro' THEN ARRAY['bajo', 'normal', 'alta', 'urgente']
    WHEN 'empresarial' THEN ARRAY['bajo', 'normal', 'alta', 'urgente']
    ELSE ARRAY['bajo', 'normal']
  END,
  updated_at = NOW()
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial', 'free')
  AND (messages_limit = 0 OR messages_limit IS NULL OR clients_limit = 0 OR clients_limit IS NULL);

-- Step 3: Verify the fix
DO $$
DECLARE
  fixed_count INTEGER;
  remaining_issues INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM profiles
  WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
    AND messages_limit > 0 AND clients_limit > 0;
  
  SELECT COUNT(*) INTO remaining_issues
  FROM profiles
  WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial')
    AND (messages_limit = 0 OR messages_limit IS NULL);
  
  RAISE NOTICE 'Successfully updated users. Total with correct limits: %, Remaining issues: %', fixed_count, remaining_issues;
END $$;

-- Step 4: Enhance configure_plan_limits function with better error handling and validation
CREATE OR REPLACE FUNCTION configure_plan_limits(
  p_user_id UUID,
  p_plan_type TEXT
)
RETURNS void AS $$
DECLARE
  v_messages_limit INTEGER;
  v_clients_limit INTEGER;
  v_has_statistics BOOLEAN;
  v_crm_level TEXT;
  v_support_levels TEXT[];
  v_rows_affected INTEGER;
BEGIN
  -- Validate input
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be NULL';
  END IF;
  
  IF p_plan_type IS NULL THEN
    RAISE EXCEPTION 'Plan type cannot be NULL';
  END IF;

  -- Configure limits based on plan type
  CASE p_plan_type
    WHEN 'free' THEN
      v_messages_limit := 999999;
      v_clients_limit := 999999;
      v_has_statistics := false;
      v_crm_level := 'basic';
      v_support_levels := ARRAY['bajo', 'normal'];
      
    WHEN 'basico' THEN
      v_messages_limit := 10000;
      v_clients_limit := 200;
      v_has_statistics := false;
      v_crm_level := 'basic';
      v_support_levels := ARRAY['bajo', 'normal'];
      
    WHEN 'avanzado' THEN
      v_messages_limit := 30000;
      v_clients_limit := 600;
      v_has_statistics := true;
      v_crm_level := 'complete';
      v_support_levels := ARRAY['bajo', 'normal'];
      
    WHEN 'pro' THEN
      v_messages_limit := 70000;
      v_clients_limit := 2000;
      v_has_statistics := true;
      v_crm_level := 'complete';
      v_support_levels := ARRAY['bajo', 'normal', 'alta', 'urgente'];
      
    WHEN 'empresarial' THEN
      v_messages_limit := 100000;
      v_clients_limit := 3000;
      v_has_statistics := true;
      v_crm_level := 'complete';
      v_support_levels := ARRAY['bajo', 'normal', 'alta', 'urgente'];
      
    ELSE
      RAISE EXCEPTION 'Invalid plan type: %', p_plan_type;
  END CASE;
  
  -- Update profile with new limits
  UPDATE profiles
  SET 
    messages_limit = v_messages_limit,
    clients_limit = v_clients_limit,
    has_statistics = v_has_statistics,
    crm_level = v_crm_level,
    support_levels = v_support_levels,
    messages_sent_this_month = COALESCE(messages_sent_this_month, 0),
    last_message_reset_date = COALESCE(last_message_reset_date, NOW()),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Verify the update was successful
  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Failed to update profile for user %. User may not exist.', p_user_id;
  END IF;
  
  -- Log success for debugging
  RAISE NOTICE 'Successfully configured plan limits for user % with plan %: messages=%, clients=%', 
    p_user_id, p_plan_type, v_messages_limit, v_clients_limit;
    
  -- Double-check the limits were actually set
  PERFORM 1 FROM profiles 
  WHERE user_id = p_user_id 
    AND messages_limit = v_messages_limit 
    AND clients_limit = v_clients_limit;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification failed: Limits were not set correctly for user %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add a trigger to prevent NULL/0 limits for paid plans
CREATE OR REPLACE FUNCTION validate_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- If plan_type is a paid plan, ensure limits are not NULL or 0
  IF NEW.plan_type IN ('basico', 'avanzado', 'pro', 'empresarial') THEN
    IF NEW.messages_limit IS NULL OR NEW.messages_limit = 0 THEN
      RAISE WARNING 'Attempted to set NULL or 0 message limit for paid plan %. Auto-configuring limits.', NEW.plan_type;
      PERFORM configure_plan_limits(NEW.user_id, NEW.plan_type);
      -- Reload the row to get updated values
      SELECT * INTO NEW FROM profiles WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS ensure_plan_limits_trigger ON profiles;
CREATE TRIGGER ensure_plan_limits_trigger
  BEFORE INSERT OR UPDATE OF plan_type ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_plan_limits();

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION configure_plan_limits(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION configure_plan_limits(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_plan_limits() TO service_role;

