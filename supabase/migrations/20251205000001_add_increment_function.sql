-- Function to increment message usage atomically
CREATE OR REPLACE FUNCTION increment_message_usage(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET messages_sent_this_month = COALESCE(messages_sent_this_month, 0) + 1
  WHERE user_id = user_id_param;
END;
$$;
