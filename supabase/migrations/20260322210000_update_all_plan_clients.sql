-- Migration: Update Global Plan Client Limits
-- Description: Increases the maximum allowed CRM clients across Avanzado, Pro, and Empresarial tiers.

-- Step 1: Fix existing users with older clients limits
UPDATE profiles
SET clients_limit = CASE plan_type
    WHEN 'basico' THEN 500
    WHEN 'avanzado' THEN 1500
    WHEN 'pro' THEN 4000
    WHEN 'empresarial' THEN 7000
    ELSE clients_limit
END
WHERE plan_type IN ('basico', 'avanzado', 'pro', 'empresarial');

-- Step 2: Update the robust upsert activation RPC
CREATE OR REPLACE FUNCTION activate_paid_plan(
  p_user_id UUID,
  p_plan_type TEXT,
  p_payment_id UUID
)
RETURNS void AS $$
BEGIN
  -- 1. Update Profile (Direct update with explicit limits)
  UPDATE profiles
  SET 
    plan_type = p_plan_type,
    payment_status = 'active',
    is_trial = false,
    updated_at = NOW(),
    messages_limit = CASE 
      WHEN p_plan_type = 'basico' THEN 10000
      WHEN p_plan_type = 'avanzado' THEN 30000
      WHEN p_plan_type = 'pro' THEN 70000
      WHEN p_plan_type = 'empresarial' THEN 100000
      ELSE 100
    END,
    clients_limit = CASE 
      WHEN p_plan_type = 'basico' THEN 500
      WHEN p_plan_type = 'avanzado' THEN 1500
      WHEN p_plan_type = 'pro' THEN 4000
      WHEN p_plan_type = 'empresarial' THEN 7000
      ELSE 20
    END,
    has_statistics = (p_plan_type IN ('avanzado', 'pro', 'empresarial')),
    crm_level = CASE 
      WHEN p_plan_type = 'basico' THEN 'basic'
      ELSE 'complete'
    END
  WHERE user_id = p_user_id;

  -- 2. Update Payment Status
  UPDATE payments
  SET status = 'approved'
  WHERE id = p_payment_id;
  
  -- 3. Update Subscriptions (Manual check + update/insert)
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = p_user_id) THEN
      UPDATE subscriptions
      SET 
        plan_type = p_plan_type,
        start_date = NOW()
      WHERE user_id = p_user_id;
  ELSE
      INSERT INTO subscriptions (user_id, plan_type, start_date)
      VALUES (p_user_id, p_plan_type, NOW());
  END IF;

END;
$$ LANGUAGE plpgsql;

-- Step 3: Update the configure_plan_limits fallback validator
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
      v_clients_limit := 500;
      v_has_statistics := false;
      v_crm_level := 'basic';
      v_support_levels := ARRAY['bajo', 'normal'];
      
    WHEN 'avanzado' THEN
      v_messages_limit := 30000;
      v_clients_limit := 1500;
      v_has_statistics := true;
      v_crm_level := 'complete';
      v_support_levels := ARRAY['bajo', 'normal'];
      
    WHEN 'pro' THEN
      v_messages_limit := 70000;
      v_clients_limit := 4000;
      v_has_statistics := true;
      v_crm_level := 'complete';
      v_support_levels := ARRAY['bajo', 'normal', 'alta', 'urgente'];
      
    WHEN 'empresarial' THEN
      v_messages_limit := 100000;
      v_clients_limit := 7000;
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
