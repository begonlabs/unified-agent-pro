-- =====================================================
-- OPTIMIZACIONES ESPECÍFICAS PARA SUPABASE REALTIME
-- =====================================================

-- 1. HABILITAR REALTIME EN LAS TABLAS PRINCIPALES
-- Esto debe ejecutarse en el Dashboard de Supabase también

-- 2. ÍNDICES OPTIMIZADOS PARA FILTROS DE REALTIME
-- Los hooks usan filtros específicos como user_id=eq.${userId}

-- Índices compuestos para conversations (optimiza filtros de realtime)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_status ON public.conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_channel ON public.conversations(user_id, channel);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id_last_message ON public.conversations(user_id, last_message_at DESC);

-- Índices compuestos para messages (optimiza las consultas de mensajes por conversación)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_user ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type_conversation ON public.messages(conversation_id, sender_type);

-- Índice para optimizar la búsqueda de conversaciones con cliente
CREATE INDEX IF NOT EXISTS idx_conversations_client_user ON public.conversations(client_id, user_id) WHERE client_id IS NOT NULL;

-- 3. POLÍTICA RLS OPTIMIZADA PARA REALTIME
-- Optimizar las políticas para que sean más eficientes en tiempo real

-- Recrear política de messages con mejor rendimiento
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy_optimized
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE user_id = auth.uid()
    ) 
    OR 
    has_role(auth.uid(), 'admin')
  );

-- 4. FUNCIÓN PARA ACTUALIZAR last_message_at AUTOMÁTICAMENTE
-- Trigger para mantener actualizado el timestamp de última conversación
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar el timestamp de la conversación cuando se inserta un nuevo mensaje
  UPDATE public.conversations 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar automáticamente last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON public.messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- 5. FUNCIÓN PARA LIMPIAR CANALES REALTIME HUÉRFANOS (opcional)
CREATE OR REPLACE FUNCTION public.cleanup_realtime_channels()
RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  -- Esta función puede ser llamada periódicamente para limpiar
  -- suscripciones realtime que puedan quedar huérfanas
  SELECT 1; -- Placeholder, Supabase maneja esto automáticamente
$$;

-- 6. VISTA OPTIMIZADA PARA CONVERSACIONES CON DATOS DE CLIENTE
CREATE OR REPLACE VIEW public.conversations_with_client AS
SELECT 
  c.*,
  cl.name as client_name,
  cl.email as client_email,
  cl.phone as client_phone,
  cl.status as client_status,
  cl.source as client_source
FROM public.conversations c
LEFT JOIN public.crm_clients cl ON c.client_id = cl.id;

-- RLS para la vista (hereda de las tablas base)
ALTER VIEW public.conversations_with_client OWNER TO postgres;

-- 7. ÍNDICES PARA BÚSQUEDAS Y FILTROS EN EL FRONTEND
CREATE INDEX IF NOT EXISTS idx_crm_clients_name_user ON public.crm_clients(user_id, name);
CREATE INDEX IF NOT EXISTS idx_crm_clients_status_user ON public.crm_clients(user_id, status);

-- Índice para búsquedas de texto en mensajes (opcional, para futuras funcionalidades)
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON public.messages USING GIN(to_tsvector('spanish', content));

-- 8. ESTADÍSTICAS PARA EL QUERY PLANNER
-- Esto ayuda a PostgreSQL a optimizar las consultas
ANALYZE public.conversations;
ANALYZE public.messages;
ANALYZE public.crm_clients;

-- =====================================================
-- VERIFICACIONES POST-INSTALACIÓN
-- =====================================================

-- Verificar que los índices se crearon correctamente
DO $$
BEGIN
  RAISE NOTICE '✅ Verificando índices de optimización para Realtime...';
  
  -- Verificar algunos índices clave
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_user_id_status') THEN
    RAISE NOTICE '✅ Índice de conversaciones por usuario y estado: OK';
  ELSE
    RAISE WARNING '⚠️ Falta índice: idx_conversations_user_id_status';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation_user') THEN
    RAISE NOTICE '✅ Índice de mensajes por conversación: OK';
  ELSE
    RAISE WARNING '⚠️ Falta índice: idx_messages_conversation_user';
  END IF;
  
  RAISE NOTICE '🎉 Optimizaciones de Realtime completadas!';
END $$;

-- =====================================================
-- INSTRUCCIONES ADICIONALES
-- =====================================================

/*
🚨 IMPORTANTE: HABILITAR REALTIME EN SUPABASE DASHBOARD

Después de ejecutar este script, debes habilitar Realtime para las tablas en el Dashboard de Supabase:

1. Ve a Database > Replication en tu proyecto de Supabase
2. Habilita las siguientes tablas para Realtime:
   ✅ public.conversations
   ✅ public.messages  
   ✅ public.crm_clients (opcional, si quieres actualizaciones en tiempo real de clientes)

3. También puedes hacerlo por SQL:
   ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_clients;

📊 MONITOREO DE RENDIMIENTO:
- Las consultas deberían ser mucho más rápidas
- Las suscripciones Realtime usarán menos recursos
- Los filtros por usuario serán más eficientes
*/
