-- Add avatar_url column to crm_clients table
ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
