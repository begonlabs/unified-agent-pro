-- Migration: Add support for 2FA recovery codes
-- Description: Creates table to store one-time recovery codes for users who lose access to their authenticator app

-- Create table for recovery codes
CREATE TABLE IF NOT EXISTS user_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON user_recovery_codes(code) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_recovery_codes_active ON user_recovery_codes(user_id, used) WHERE NOT used;

-- Add comment for documentation
COMMENT ON TABLE user_recovery_codes IS 'Stores one-time recovery codes for 2FA backup authentication';
COMMENT ON COLUMN user_recovery_codes.code IS 'Encrypted recovery code (8 characters alphanumeric)';
COMMENT ON COLUMN user_recovery_codes.used IS 'Whether this code has been used (one-time use only)';

-- Enable Row Level Security
ALTER TABLE user_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own recovery codes
CREATE POLICY "Users can view own recovery codes"
  ON user_recovery_codes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own recovery codes
CREATE POLICY "Users can insert own recovery codes"
  ON user_recovery_codes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own recovery codes (mark as used)
CREATE POLICY "Users can update own recovery codes"
  ON user_recovery_codes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own recovery codes
CREATE POLICY "Users can delete own recovery codes"
  ON user_recovery_codes
  FOR DELETE
  USING (auth.uid() = user_id);
