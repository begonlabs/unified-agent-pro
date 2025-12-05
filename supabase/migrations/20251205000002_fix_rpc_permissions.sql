-- Drop function first to ensure clean state
DROP FUNCTION IF EXISTS increment_message_usage(UUID);

-- Recreate function with updated_at and explicit permissions
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
