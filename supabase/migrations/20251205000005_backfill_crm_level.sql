-- Migration: Backfill crm_level for existing users
-- This ensures that users have the correct CRM access level based on their plan

DO $$
BEGIN
  -- Update Basic Plan users
  UPDATE profiles 
  SET crm_level = 'basic' 
  WHERE plan_type = 'basico' AND (crm_level IS NULL OR crm_level = 'none');

  -- Update Advanced, Pro, and Enterprise Plan users
  UPDATE profiles 
  SET crm_level = 'complete' 
  WHERE plan_type IN ('avanzado', 'pro', 'empresarial') AND (crm_level IS NULL OR crm_level = 'none');

  -- Update Trial users
  UPDATE profiles 
  SET crm_level = 'complete' 
  WHERE is_trial = true AND (crm_level IS NULL OR crm_level = 'none');

END $$;
