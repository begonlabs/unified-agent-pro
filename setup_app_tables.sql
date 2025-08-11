-- =====================================================
-- OndAI - Tablas de Integraciones, IA y CRM
-- NOTA: Este script asume que ya ejecutaste setup_user_tables.sql
--       (que crea: public.user_role, public.profiles, public.user_roles,
--        función public.has_role, trigger de perfiles, etc.)
-- =====================================================

-- Asegurar search_path
SET search_path = public;

-- Usar gen_random_uuid()
-- extension suele venir habilitada en Supabase, si no:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) CRM: Clientes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead', -- lead | prospect | client | inactive
  tags TEXT[] DEFAULT '{}',
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_clients_select_policy ON public.crm_clients;
CREATE POLICY crm_clients_select_policy
  ON public.crm_clients FOR SELECT  
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS crm_clients_insert_policy ON public.crm_clients;
CREATE POLICY crm_clients_insert_policy
  ON public.crm_clients FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS crm_clients_update_policy ON public.crm_clients;
CREATE POLICY crm_clients_update_policy
  ON public.crm_clients FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS crm_clients_delete_policy ON public.crm_clients;
CREATE POLICY crm_clients_delete_policy
  ON public.crm_clients FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_crm_clients_user_id ON public.crm_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_clients_name ON public.crm_clients(name);
CREATE INDEX IF NOT EXISTS idx_crm_clients_email ON public.crm_clients(email);

-- =====================================================
-- 2) Conversaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.crm_clients(id) ON DELETE SET NULL,
  channel TEXT NOT NULL, -- whatsapp | facebook | instagram
  channel_thread_id TEXT,
  status TEXT DEFAULT 'open',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_policy ON public.conversations;
CREATE POLICY conversations_select_policy
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS conversations_insert_policy ON public.conversations;
CREATE POLICY conversations_insert_policy
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS conversations_update_policy ON public.conversations;
CREATE POLICY conversations_update_policy
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS conversations_delete_policy ON public.conversations;
CREATE POLICY conversations_delete_policy
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at);

-- =====================================================
-- 3) Mensajes (sin user_id, ligado a conversations)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- client | human | ai
  sender_name TEXT,
  is_automated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS por pertenencia de la conversación al usuario o admin
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy
  ON public.messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

DROP POLICY IF EXISTS messages_update_policy ON public.messages;
CREATE POLICY messages_update_policy
  ON public.messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

DROP POLICY IF EXISTS messages_delete_policy ON public.messages;
CREATE POLICY messages_delete_policy
  ON public.messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
      AND (c.user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  ));

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =====================================================
-- 4) Configuración de IA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goals TEXT,
  restrictions TEXT,
  common_questions TEXT,
  response_time INTEGER DEFAULT 30,
  knowledge_base TEXT,
  faq TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ai_configurations_select_policy ON public.ai_configurations;
CREATE POLICY ai_configurations_select_policy
  ON public.ai_configurations FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS ai_configurations_insert_policy ON public.ai_configurations;
CREATE POLICY ai_configurations_insert_policy
  ON public.ai_configurations FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS ai_configurations_update_policy ON public.ai_configurations;
CREATE POLICY ai_configurations_update_policy
  ON public.ai_configurations FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS ai_configurations_delete_policy ON public.ai_configurations;
CREATE POLICY ai_configurations_delete_policy
  ON public.ai_configurations FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_ai_configurations_user_id ON public.ai_configurations(user_id);

-- =====================================================
-- 5) Integraciones de Canales (WhatsApp, Facebook, Instagram)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL, -- whatsapp | facebook | instagram
  channel_config JSONB,
  is_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS communication_channels_select_policy ON public.communication_channels;
CREATE POLICY communication_channels_select_policy
  ON public.communication_channels FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS communication_channels_insert_policy ON public.communication_channels;
CREATE POLICY communication_channels_insert_policy
  ON public.communication_channels FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS communication_channels_update_policy ON public.communication_channels;
CREATE POLICY communication_channels_update_policy
  ON public.communication_channels FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS communication_channels_delete_policy ON public.communication_channels;
CREATE POLICY communication_channels_delete_policy
  ON public.communication_channels FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_communication_channels_user_id ON public.communication_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_channels_type ON public.communication_channels(channel_type);

-- =====================================================
-- 6) Estadísticas por canal/usuario (para dashboards)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL, -- whatsapp | facebook | instagram
  total_messages INTEGER DEFAULT 0,
  human_messages INTEGER DEFAULT 0,
  automated_messages INTEGER DEFAULT 0,
  new_leads INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  response_rate NUMERIC DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS statistics_select_policy ON public.statistics;
CREATE POLICY statistics_select_policy
  ON public.statistics FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS statistics_insert_policy ON public.statistics;
CREATE POLICY statistics_insert_policy
  ON public.statistics FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS statistics_update_policy ON public.statistics;
CREATE POLICY statistics_update_policy
  ON public.statistics FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS statistics_delete_policy ON public.statistics;
CREATE POLICY statistics_delete_policy
  ON public.statistics FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_statistics_user_id ON public.statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_statistics_date ON public.statistics(date);
CREATE INDEX IF NOT EXISTS idx_statistics_channel ON public.statistics(channel);

-- =====================================================
-- 7) Mensajes de soporte (admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open | in_progress | resolved
  priority TEXT DEFAULT 'medium', -- low | medium | high
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_messages_select_policy ON public.support_messages;
CREATE POLICY support_messages_select_policy
  ON public.support_messages FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS support_messages_insert_policy ON public.support_messages;
CREATE POLICY support_messages_insert_policy
  ON public.support_messages FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS support_messages_update_policy ON public.support_messages;
CREATE POLICY support_messages_update_policy
  ON public.support_messages FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS support_messages_delete_policy ON public.support_messages;
CREATE POLICY support_messages_delete_policy
  ON public.support_messages FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_priority ON public.support_messages(priority);

-- =====================================================
-- 8) Vista de estadísticas generales (afectada por RLS subyacente)
--    Admin verá todo si las políticas permiten has_role(...,'admin') en tablas base
-- =====================================================
CREATE OR REPLACE VIEW public.admin_general_stats AS
SELECT
  -- Clientes por plan (si no tienes plan_type en profiles, ajusta a tu esquema)
  (SELECT COUNT(*) FROM public.profiles) AS total_clients,
  (SELECT COUNT(*) FROM public.profiles WHERE plan_type = 'free') AS free_clients,
  (SELECT COUNT(*) FROM public.profiles WHERE plan_type = 'premium') AS premium_clients,
  (SELECT COUNT(*) FROM public.profiles WHERE plan_type = 'enterprise') AS enterprise_clients,

  -- Totales plataforma (suma condicionada por RLS)
  (SELECT COALESCE(SUM(total_messages), 0) FROM public.statistics) AS total_messages_platform,
  (SELECT COALESCE(SUM(new_leads), 0) FROM public.statistics) AS total_leads_platform,

  -- Por canal
  (SELECT COALESCE(SUM(total_messages), 0) FROM public.statistics WHERE channel = 'whatsapp') AS whatsapp_messages,
  (SELECT COALESCE(SUM(total_messages), 0) FROM public.statistics WHERE channel = 'facebook') AS facebook_messages,
  (SELECT COALESCE(SUM(total_messages), 0) FROM public.statistics WHERE channel = 'instagram') AS instagram_messages,
  (SELECT COALESCE(SUM(new_leads), 0) FROM public.statistics WHERE channel = 'whatsapp') AS whatsapp_leads,
  (SELECT COALESCE(SUM(new_leads), 0) FROM public.statistics WHERE channel = 'facebook') AS facebook_leads,
  (SELECT COALESCE(SUM(new_leads), 0) FROM public.statistics WHERE channel = 'instagram') AS instagram_leads;

-- =====================================================
-- FIN
-- =====================================================

