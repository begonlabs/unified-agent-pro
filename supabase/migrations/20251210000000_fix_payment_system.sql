-- Migration to fix payment system stability
-- Consolidates fixes for:
-- 1. Database trigger conflicts (recursion on profile updates)
-- 2. Schema mismatch in subscriptions table (missing status column and unique constraint)

-- PART 1: Clean up and fix Triggers to prevent loops
DROP TRIGGER IF EXISTS ensure_plan_limits_trigger ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON profiles;
DROP TRIGGER IF EXISTS handle_new_user ON profiles;

-- Simplify validation logic
CREATE OR REPLACE FUNCTION validate_plan_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- SIMPLIFIED LOGIC: Only set defaults if NULL
  IF NEW.messages_limit IS NULL THEN
     NEW.messages_limit := 100;
  END IF;
  
  IF NEW.clients_limit IS NULL THEN
     NEW.clients_limit := 20;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create LIMITS trigger (BEFORE INSERT ONLY to avoid update loops)
CREATE TRIGGER ensure_plan_limits_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_plan_limits();

-- Re-create UPDATED_AT trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PART 2: Fix activation function (Robust Upsert & Schema Correction)
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
      WHEN p_plan_type = 'basico' THEN 200
      WHEN p_plan_type = 'avanzado' THEN 600
      WHEN p_plan_type = 'pro' THEN 2000
      WHEN p_plan_type = 'empresarial' THEN 3000
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
  -- Handles missing unique constraints and missing schema columns safely
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
