-- =====================================================
-- FIX SUPPORT TICKETS ADMIN ACCESS
-- =====================================================
-- This migration ensures admins can view and manage all support tickets
-- Created: 2025-12-10

-- 1. DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Users can view messages from own tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create messages in own tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.support_messages;

-- 2. ENSURE support_tickets TABLE EXISTS AND HAS RLS ENABLED
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 3. ENSURE support_messages HAS TICKET FIELDS
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'admin', 'system')),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 4. CREATE USER POLICIES FOR support_tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. CREATE ADMIN POLICIES FOR support_tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 6. CREATE USER POLICIES FOR support_messages
CREATE POLICY "Users can view messages from own tickets"
  ON public.support_messages
  FOR SELECT
  USING (
    ticket_id IS NULL OR -- For legacy messages without ticket_id
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own tickets"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    ticket_id IS NULL OR -- For legacy messages
    (
      auth.uid() = user_id AND
      EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
      )
    )
  );

-- 7. CREATE ADMIN POLICIES FOR support_messages
CREATE POLICY "Admins can view all messages"
  ON public.support_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON public.support_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 8. CREATE INDEXES FOR PERFORMANCE (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_message_type ON public.support_messages(message_type);

-- 9. ENSURE RPC FUNCTION EXISTS
CREATE OR REPLACE FUNCTION public.get_user_tickets_with_message_count(_user_id UUID)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  message_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    st.id,
    st.subject,
    st.priority,
    st.status,
    st.created_at,
    st.updated_at,
    COUNT(sm.id) as message_count,
    MAX(sm.created_at) as last_message_at,
    COUNT(CASE WHEN sm.message_type != 'user' AND sm.is_read = false THEN 1 END) as unread_count
  FROM public.support_tickets st
  LEFT JOIN public.support_messages sm ON st.id = sm.ticket_id
  WHERE st.user_id = _user_id
  GROUP BY st.id, st.subject, st.priority, st.status, st.created_at, st.updated_at
  ORDER BY st.updated_at DESC;
$$;

-- 10. VERIFICATION
DO $$
BEGIN
  RAISE NOTICE '✅ Support tickets admin access policies fixed';
  RAISE NOTICE '📋 Admins can now view all support tickets';
  RAISE NOTICE '💬 Admins can now view and manage all support messages';
  RAISE NOTICE '🔧 RLS policies properly configured';
END $$;
