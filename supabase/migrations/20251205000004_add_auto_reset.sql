-- Migration: Add auto-reset logic to increment_message_usage
-- This ensures the message counter resets automatically when a new month starts

CREATE OR REPLACE FUNCTION increment_message_usage(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_reset TIMESTAMP WITH TIME ZONE;
  v_current_month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the last reset date
  SELECT last_message_reset_date INTO v_last_reset
  FROM profiles
  WHERE user_id = user_id_param;

  -- Calculate the start of the current month
  v_current_month_start := DATE_TRUNC('month', NOW());

  -- Check if we need to reset (if last reset was before this month)
  IF v_last_reset IS NULL OR v_last_reset < v_current_month_start THEN
    -- Reset counter and update reset date
    UPDATE profiles
    SET 
      messages_sent_this_month = 1, -- Start at 1 for this message
      last_message_reset_date = NOW(),
      updated_at = NOW()
    WHERE user_id = user_id_param;
  ELSE
    -- Just increment
    UPDATE profiles
    SET 
      messages_sent_this_month = COALESCE(messages_sent_this_month, 0) + 1,
      updated_at = NOW()
    WHERE user_id = user_id_param;
  END IF;
END;
$$;

-- Grant permissions explicitly (just in case)
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_message_usage(UUID) TO anon;
