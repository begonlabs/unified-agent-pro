-- Fix missing columns in profiles table
-- This migration ensures that all columns required for plan limits and usage tracking exist

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS messages_sent_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS messages_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clients_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS has_statistics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crm_level TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS support_levels TEXT[] DEFAULT ARRAY['bajo', 'normal'];

-- Re-apply the increment function to ensure it works with the columns
CREATE OR REPLACE FUNCTION increment_message_usage(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    messages_sent_this_month = COALESCE(messages_sent_this_month, 0) + 1,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO anon;

-- Backfill limits for existing users to avoid 0/0 issue
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if configure_plan_limits function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'configure_plan_limits') THEN
    FOR user_record IN SELECT user_id, plan_type FROM profiles
    LOOP
      PERFORM configure_plan_limits(user_record.user_id, COALESCE(user_record.plan_type, 'free'));
    END LOOP;
  ELSE
    -- Fallback manual update if function doesn't exist yet
    UPDATE profiles SET messages_limit = 10000, clients_limit = 200 WHERE plan_type = 'basico';
    UPDATE profiles SET messages_limit = 30000, clients_limit = 600 WHERE plan_type = 'avanzado';
    UPDATE profiles SET messages_limit = 70000, clients_limit = 2000 WHERE plan_type = 'pro';
    UPDATE profiles SET messages_limit = 100000, clients_limit = 3000 WHERE plan_type = 'empresarial';
    -- Free/Trial
    UPDATE profiles SET messages_limit = 999999, clients_limit = 999999 WHERE plan_type = 'free' OR plan_type IS NULL;
  END IF;
END $$;
