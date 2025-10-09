-- Create instagram_verifications table for handling Instagram verification codes
-- This table stores verification codes and their status for Instagram channel validation

CREATE TABLE IF NOT EXISTS public.instagram_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES communication_channels(id) ON DELETE CASCADE,
  verification_code VARCHAR(20) NOT NULL UNIQUE,
  business_account_id VARCHAR(100),
  sender_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  message_content TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_verifications_code ON instagram_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_instagram_verifications_user_id ON instagram_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_verifications_channel_id ON instagram_verifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_instagram_verifications_status ON instagram_verifications(status);
CREATE INDEX IF NOT EXISTS idx_instagram_verifications_expires_at ON instagram_verifications(expires_at);

-- Add RLS policies
ALTER TABLE instagram_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own verification records
CREATE POLICY "Users can access their own instagram verifications"
  ON instagram_verifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_instagram_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_instagram_verifications_updated_at
    BEFORE UPDATE ON instagram_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_instagram_verifications_updated_at();

-- Add constraint to ensure verification_code format (IG-XXXXX)
ALTER TABLE instagram_verifications 
ADD CONSTRAINT check_verification_code_format 
CHECK (verification_code ~ '^IG-[0-9]{5}$');

COMMENT ON TABLE instagram_verifications IS 'Stores Instagram verification codes for business account ID resolution';
COMMENT ON COLUMN instagram_verifications.verification_code IS 'Unique verification code in format IG-XXXXX';
COMMENT ON COLUMN instagram_verifications.business_account_id IS 'The correct business account ID extracted from webhook messages';
COMMENT ON COLUMN instagram_verifications.sender_id IS 'The sender ID from the verification message webhook';
COMMENT ON COLUMN instagram_verifications.status IS 'Verification status: pending, completed, expired';
COMMENT ON COLUMN instagram_verifications.message_content IS 'The full message content containing the verification code';
COMMENT ON COLUMN instagram_verifications.expires_at IS 'When the verification code expires (30 minutes)';
