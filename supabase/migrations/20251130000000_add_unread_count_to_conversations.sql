-- Migration: Add unread_count to conversations table
-- Date: 2025-11-30
-- Description: Adds unread_count field to track unread messages in conversations

-- Add unread_count column with default value 0
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Create index for better performance when filtering by unread messages
CREATE INDEX IF NOT EXISTS idx_conversations_unread 
ON conversations(user_id, unread_count) 
WHERE unread_count > 0;

-- Add comment to document the column
COMMENT ON COLUMN conversations.unread_count IS 'Number of unread messages from client in this conversation';
