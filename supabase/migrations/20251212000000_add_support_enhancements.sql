-- =====================================================
-- SUPPORT SYSTEM ENHANCEMENTS
-- =====================================================
-- Adds new fields and tables for enhanced support features
-- Created: 2025-12-12

-- 1. ADD NEW COLUMNS TO support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS first_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5);

-- 2. CREATE INTERNAL NOTES TABLE
CREATE TABLE IF NOT EXISTS public.support_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS ON INTERNAL NOTES
ALTER TABLE public.support_internal_notes ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES FOR INTERNAL NOTES (ADMIN ONLY)
CREATE POLICY "Admins can view all internal notes"
  ON public.support_internal_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create internal notes"
  ON public.support_internal_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update internal notes"
  ON public.support_internal_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete internal notes"
  ON public.support_internal_notes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_tags ON public.support_tickets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_support_tickets_resolved_at ON public.support_tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_internal_notes_ticket_id ON public.support_internal_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_internal_notes_admin_id ON public.support_internal_notes(admin_id);

-- 6. CREATE FUNCTION TO AUTO-UPDATE first_response_at
CREATE OR REPLACE FUNCTION public.update_first_response_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is an admin message and first_response_at is not set
  IF NEW.message_type = 'admin' THEN
    UPDATE public.support_tickets
    SET first_response_at = COALESCE(first_response_at, NEW.created_at)
    WHERE id = NEW.ticket_id AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. CREATE TRIGGER FOR first_response_at
DROP TRIGGER IF EXISTS trigger_update_first_response ON public.support_messages;
CREATE TRIGGER trigger_update_first_response
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_first_response_at();

-- 8. CREATE FUNCTION TO AUTO-UPDATE resolved_at
CREATE OR REPLACE FUNCTION public.update_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set resolved_at when status changes to 'closed'
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.resolved_at = NOW();
  END IF;
  
  -- Clear resolved_at if ticket is reopened
  IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. CREATE TRIGGER FOR resolved_at
DROP TRIGGER IF EXISTS trigger_update_resolved_at ON public.support_tickets;
CREATE TRIGGER trigger_update_resolved_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_resolved_at();

-- 10. CREATE VIEW FOR TICKET ANALYTICS
CREATE OR REPLACE VIEW public.support_ticket_analytics AS
SELECT 
  st.id,
  st.user_id,
  st.subject,
  st.priority,
  st.status,
  st.assigned_to,
  st.created_at,
  st.updated_at,
  st.first_response_at,
  st.resolved_at,
  st.customer_satisfaction,
  st.tags,
  -- Calculate response time in hours
  EXTRACT(EPOCH FROM (st.first_response_at - st.created_at)) / 3600 AS response_time_hours,
  -- Calculate resolution time in hours
  EXTRACT(EPOCH FROM (st.resolved_at - st.created_at)) / 3600 AS resolution_time_hours,
  -- Count messages
  (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id) AS message_count,
  -- Count admin messages
  (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id AND message_type = 'admin') AS admin_message_count,
  -- Get last message time
  (SELECT MAX(created_at) FROM support_messages WHERE ticket_id = st.id) AS last_message_at
FROM public.support_tickets st;

-- 11. VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '✅ Support system enhancements applied';
  RAISE NOTICE '📋 New columns: tags, first_response_at, resolved_at, customer_satisfaction';
  RAISE NOTICE '📝 New table: support_internal_notes';
  RAISE NOTICE '🔧 Triggers: auto-update first_response_at and resolved_at';
  RAISE NOTICE '📊 View: support_ticket_analytics for reporting';
END $$;
