-- Add unread_count column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0 NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN conversations.unread_count IS 'Number of unread messages from client in this conversation';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count ON conversations(unread_count) WHERE unread_count > 0;

-- Create function to increment unread count and update last_message_at
CREATE OR REPLACE FUNCTION increment_unread(conversation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET 
    unread_count = unread_count + 1,
    last_message_at = NOW(),
    status = 'open'
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
