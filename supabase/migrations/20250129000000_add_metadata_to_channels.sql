-- Add metadata column to communication_channels table
ALTER TABLE communication_channels 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN communication_channels.metadata IS 'Stores additional channel information like business info, configuration details, etc.';
