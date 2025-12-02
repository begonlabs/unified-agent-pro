-- Migration: Add plan restriction fields
-- Created: 2025-12-02
-- Description: Adds fields for message limits, client limits, CRM level, and statistics access

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS messages_sent_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clients_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset_date TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS has_statistics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crm_level TEXT DEFAULT 'none' CHECK (crm_level IN ('none', 'basic', 'complete')),
ADD COLUMN IF NOT EXISTS support_levels TEXT[] DEFAULT ARRAY['bajo', 'normal'];

-- Function to reset monthly message counters
CREATE OR REPLACE FUNCTION reset_monthly_message_counters()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET messages_sent_this_month = 0,
      last_message_reset_date = NOW()
  WHERE last_message_reset_date < DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to configure plan limits when activating a plan
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
BEGIN
  -- Configure limits based on plan type
  CASE p_plan_type
    WHEN 'free' THEN
      -- Trial plan
      v_messages_limit := 999999; -- Unlimited during trial
      v_clients_limit := 999999; -- Unlimited during trial
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
      -- Default to free plan limits
      v_messages_limit := 0;
      v_clients_limit := 0;
      v_has_statistics := false;
      v_crm_level := 'none';
      v_support_levels := ARRAY['bajo'];
  END CASE;
  
  -- Update profile with new limits
  UPDATE profiles
  SET 
    messages_limit = v_messages_limit,
    clients_limit = v_clients_limit,
    has_statistics = v_has_statistics,
    crm_level = v_crm_level,
    support_levels = v_support_levels,
    messages_sent_this_month = 0,
    last_message_reset_date = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing activate_paid_plan function to use configure_plan_limits
CREATE OR REPLACE FUNCTION activate_paid_plan(
  p_user_id UUID,
  p_plan_type TEXT,
  p_payment_id UUID
)
RETURNS void AS $$
BEGIN
  -- Update profile
  UPDATE profiles
  SET 
    plan_type = p_plan_type,
    payment_status = 'active',
    is_trial = false
  WHERE user_id = p_user_id;
  
  -- Configure plan limits
  PERFORM configure_plan_limits(p_user_id, p_plan_type);
  
  -- Update payment status
  UPDATE payments
  SET status = 'approved'
  WHERE id = p_payment_id;
  
  -- Create or update subscription
  INSERT INTO subscriptions (user_id, plan_type, status, start_date)
  VALUES (p_user_id, p_plan_type, 'active', NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    plan_type = p_plan_type,
    status = 'active',
    start_date = NOW();
END;
$$ LANGUAGE plpgsql;

-- Update handle_new_user to configure trial limits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, trial_start_date, trial_end_date, is_trial, payment_status, plan_type)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW() + INTERVAL '7 days',
    true,
    'trial',
    'free'
  );
  
  -- Configure trial plan limits
  PERFORM configure_plan_limits(NEW.id, 'free');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Migrate existing users to have plan limits
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT user_id, plan_type FROM profiles
  LOOP
    PERFORM configure_plan_limits(user_record.user_id, COALESCE(user_record.plan_type, 'free'));
  END LOOP;
END $$;
