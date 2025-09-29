-- Create SMS verifications table for WhatsApp Cloud API
CREATE TABLE IF NOT EXISTS public.sms_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_verifications_user_id ON public.sms_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_status ON public.sms_verifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires_at ON public.sms_verifications(expires_at);

-- Add RLS policies
ALTER TABLE public.sms_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own verifications
CREATE POLICY "Users can access own SMS verifications" ON public.sms_verifications
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all verifications
CREATE POLICY "Service role can access all SMS verifications" ON public.sms_verifications
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_sms_verifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_verifications_updated_at
  BEFORE UPDATE ON public.sms_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sms_verifications_updated_at();

-- Clean up expired verifications (run this periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_verifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.sms_verifications 
  SET status = 'expired'
  WHERE status = 'pending' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
