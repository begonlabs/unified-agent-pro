-- Add metadata column to crm_clients table for storing additional client information
-- This will be used to store profile fetch errors and other debugging info

ALTER TABLE crm_clients 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on metadata
CREATE INDEX IF NOT EXISTS idx_crm_clients_metadata ON crm_clients USING gin(metadata);

-- Add comment to document the column purpose
COMMENT ON COLUMN crm_clients.metadata IS 'JSON field for storing additional client metadata, including profile fetch errors and other debugging information';
