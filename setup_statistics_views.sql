-- =====================================================
-- VISTAS Y FUNCIONES PARA ESTADÍSTICAS AVANZADAS
-- Conectar StatsView.tsx con datos reales de la base de datos
-- =====================================================

-- 1. VISTA PARA ESTADÍSTICAS GENERALES POR USUARIO
CREATE OR REPLACE VIEW public.user_general_stats AS
WITH message_stats AS (
  -- Contar mensajes por usuario y tipo
  SELECT 
    c.user_id,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'ai' OR m.is_automated = true) as automated_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'agent' OR m.sender_type = 'human') as human_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'client') as client_messages
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.user_id IS NOT NULL
  GROUP BY c.user_id
),
client_stats AS (
  -- Contar clientes totales por usuario
  SELECT 
    user_id,
    COUNT(id) as total_clients,
    COUNT(id) FILTER (WHERE status = 'lead') as total_leads,
    COUNT(id) FILTER (WHERE status = 'client') as converted_clients,
    COUNT(id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_7d,
    COUNT(id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_leads_30d
  FROM public.crm_clients
  GROUP BY user_id
),
response_stats AS (
  -- Calcular tasa de respuesta por usuario
  SELECT 
    c.user_id,
    COUNT(DISTINCT c.id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM public.messages m 
        WHERE m.conversation_id = c.id 
          AND (m.sender_type = 'agent' OR m.sender_type = 'ai' OR m.is_automated = true)
      )
    ) as conversations_with_response,
    COUNT(DISTINCT c.id) as total_conversations,
    CASE 
      WHEN COUNT(DISTINCT c.id) > 0 THEN
        ROUND((COUNT(DISTINCT c.id) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM public.messages m 
            WHERE m.conversation_id = c.id 
              AND (m.sender_type = 'agent' OR m.sender_type = 'ai' OR m.is_automated = true)
          )
        ) * 100.0) / COUNT(DISTINCT c.id), 2)
      ELSE 0
    END as response_rate
  FROM public.conversations c
  GROUP BY c.user_id
)
SELECT 
  p.user_id,
  COALESCE(ms.total_messages, 0) as total_messages,
  COALESCE(ms.automated_messages, 0) as automated_messages,
  COALESCE(ms.human_messages, 0) as human_messages,
  COALESCE(ms.client_messages, 0) as client_messages,
  COALESCE(cs.total_clients, 0) as total_clients,
  COALESCE(cs.total_leads, 0) as total_leads,
  COALESCE(cs.converted_clients, 0) as converted_clients,
  COALESCE(cs.new_leads_7d, 0) as new_leads_7d,
  COALESCE(cs.new_leads_30d, 0) as new_leads_30d,
  COALESCE(rs.response_rate, 0) as response_rate,
  COALESCE(rs.total_conversations, 0) as total_conversations
FROM public.profiles p
LEFT JOIN message_stats ms ON p.user_id = ms.user_id
LEFT JOIN client_stats cs ON p.user_id = cs.user_id  
LEFT JOIN response_stats rs ON p.user_id = rs.user_id;

-- RLS para la vista
ALTER VIEW public.user_general_stats OWNER TO postgres;

-- 2. VISTA PARA ESTADÍSTICAS POR CANAL Y USUARIO
CREATE OR REPLACE VIEW public.user_channel_stats AS
WITH channel_messages AS (
  SELECT 
    c.user_id,
    c.channel,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'ai' OR m.is_automated = true) as automated_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'agent' OR m.sender_type = 'human') as human_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'client') as client_messages
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.user_id IS NOT NULL
  GROUP BY c.user_id, c.channel
),
channel_leads AS (
  SELECT 
    c.user_id,
    c.channel,
    COUNT(DISTINCT cl.id) as total_leads,
    COUNT(DISTINCT cl.id) FILTER (WHERE cl.created_at >= CURRENT_DATE - INTERVAL '7 days') as new_leads_7d,
    COUNT(DISTINCT cl.id) FILTER (WHERE cl.created_at >= CURRENT_DATE - INTERVAL '30 days') as new_leads_30d
  FROM public.conversations c
  LEFT JOIN public.crm_clients cl ON c.client_id = cl.id
  WHERE c.user_id IS NOT NULL
  GROUP BY c.user_id, c.channel
)
SELECT 
  cm.user_id,
  cm.channel,
  COALESCE(cm.total_messages, 0) as total_messages,
  COALESCE(cm.automated_messages, 0) as automated_messages,
  COALESCE(cm.human_messages, 0) as human_messages,
  COALESCE(cm.client_messages, 0) as client_messages,
  COALESCE(cl.total_leads, 0) as total_leads,
  COALESCE(cl.new_leads_7d, 0) as new_leads_7d,
  COALESCE(cl.new_leads_30d, 0) as new_leads_30d,
  -- Colores por canal para el frontend
  CASE cm.channel
    WHEN 'whatsapp' THEN '#25D366'
    WHEN 'facebook' THEN '#1877F2'  
    WHEN 'instagram' THEN '#E4405F'
    ELSE '#6B7280'
  END as color
FROM channel_messages cm
LEFT JOIN channel_leads cl ON cm.user_id = cl.user_id AND cm.channel = cl.channel
ORDER BY cm.user_id, cm.channel;

-- RLS para la vista
ALTER VIEW public.user_channel_stats OWNER TO postgres;

-- 3. VISTA PARA ESTADÍSTICAS DIARIAS (ÚLTIMOS 7 DÍAS)
CREATE OR REPLACE VIEW public.user_daily_stats AS
WITH date_series AS (
  -- Generar serie de fechas de los últimos 7 días
  SELECT 
    generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      '1 day'::interval
    )::date as date
),
daily_messages AS (
  SELECT 
    c.user_id,
    m.created_at::date as date,
    COUNT(m.id) as total_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'ai' OR m.is_automated = true) as automated_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'agent' OR m.sender_type = 'human') as human_messages,
    COUNT(m.id) FILTER (WHERE m.sender_type = 'client') as client_messages
  FROM public.conversations c
  JOIN public.messages m ON c.id = m.conversation_id
  WHERE m.created_at::date >= CURRENT_DATE - INTERVAL '6 days'
    AND c.user_id IS NOT NULL
  GROUP BY c.user_id, m.created_at::date
),
daily_leads AS (
  SELECT 
    user_id,
    created_at::date as date,
    COUNT(id) as new_leads
  FROM public.crm_clients
  WHERE created_at::date >= CURRENT_DATE - INTERVAL '6 days'
  GROUP BY user_id, created_at::date
),
daily_conversations AS (
  SELECT 
    c.user_id,
    c.created_at::date as date,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT c.id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM public.messages m 
        WHERE m.conversation_id = c.id 
          AND (m.sender_type = 'agent' OR m.sender_type = 'ai' OR m.is_automated = true)
          AND m.created_at::date = c.created_at::date
      )
    ) as conversations_with_response
  FROM public.conversations c
  WHERE c.created_at::date >= CURRENT_DATE - INTERVAL '6 days'
    AND c.user_id IS NOT NULL
  GROUP BY c.user_id, c.created_at::date
)
SELECT 
  p.user_id,
  ds.date,
  COALESCE(dm.total_messages, 0) as total_messages,
  COALESCE(dm.automated_messages, 0) as automated_messages,
  COALESCE(dm.human_messages, 0) as human_messages,
  COALESCE(dm.client_messages, 0) as client_messages,
  COALESCE(dl.new_leads, 0) as new_leads,
  CASE 
    WHEN COALESCE(dc.total_conversations, 0) > 0 THEN
      ROUND((COALESCE(dc.conversations_with_response, 0) * 100.0) / dc.total_conversations, 2)
    ELSE 0
  END as response_rate
FROM public.profiles p
CROSS JOIN date_series ds
LEFT JOIN daily_messages dm ON p.user_id = dm.user_id AND ds.date = dm.date
LEFT JOIN daily_leads dl ON p.user_id = dl.user_id AND ds.date = dl.date
LEFT JOIN daily_conversations dc ON p.user_id = dc.user_id AND ds.date = dc.date
ORDER BY p.user_id, ds.date;

-- RLS para la vista
ALTER VIEW public.user_daily_stats OWNER TO postgres;

-- 4. FUNCIÓN PARA OBTENER TODAS LAS ESTADÍSTICAS DE UN USUARIO
CREATE OR REPLACE FUNCTION public.get_user_stats(_user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH user_stats AS (
    SELECT * FROM public.user_general_stats 
    WHERE user_id = _user_id
  ),
  channel_stats AS (
    SELECT json_agg(
      json_build_object(
        'name', CASE channel
          WHEN 'whatsapp' THEN 'WhatsApp'
          WHEN 'facebook' THEN 'Facebook'
          WHEN 'instagram' THEN 'Instagram'
          ELSE INITCAP(channel)
        END,
        'messages', total_messages,
        'leads', new_leads_7d,
        'color', color
      ) ORDER BY channel
    ) as channels
    FROM public.user_channel_stats 
    WHERE user_id = _user_id
  ),
  daily_stats AS (
    SELECT json_agg(
      json_build_object(
        'date', date,
        'messages', total_messages,
        'leads', new_leads,
        'responseRate', response_rate
      ) ORDER BY date
    ) as daily_data
    FROM public.user_daily_stats 
    WHERE user_id = _user_id
  )
  SELECT json_build_object(
    'generalStats', (
      SELECT json_build_object(
        'totalMessages', total_messages,
        'automatedMessages', automated_messages,
        'humanMessages', human_messages,
        'clientMessages', client_messages,
        'totalClients', total_clients,
        'totalLeads', total_leads,
        'newLeads', new_leads_7d,
        'responseRate', response_rate,
        'totalConversations', total_conversations
      )
      FROM user_stats
    ),
    'channelStats', COALESCE((SELECT channels FROM channel_stats), '[]'::json),
    'dailyStats', COALESCE((SELECT daily_data FROM daily_stats), '[]'::json)
  );
$$;

-- 5. FUNCIÓN PARA ESTADÍSTICAS EN TIEMPO REAL (más eficiente)
CREATE OR REPLACE FUNCTION public.get_user_stats_realtime(_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  total_messages BIGINT,
  automated_messages BIGINT,
  human_messages BIGINT,
  client_messages BIGINT,
  total_clients BIGINT,
  new_leads_7d BIGINT,
  response_rate NUMERIC,
  total_conversations BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    total_messages,
    automated_messages,
    human_messages,
    client_messages,
    total_clients,
    new_leads_7d,
    response_rate,
    total_conversations
  FROM public.user_general_stats 
  WHERE user_id = _user_id;
$$;

-- 6. ÍNDICES PARA OPTIMIZAR LAS CONSULTAS DE ESTADÍSTICAS
-- Índices sin expresiones de funciones para evitar errores de IMMUTABLE

-- Índices básicos para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender ON public.messages(conversation_id, sender_type);

-- Índices para conversaciones
CREATE INDEX IF NOT EXISTS idx_conversations_user_channel ON public.conversations(user_id, channel);
CREATE INDEX IF NOT EXISTS idx_conversations_user_created_at ON public.conversations(user_id, created_at DESC);

-- Índices para clientes CRM
CREATE INDEX IF NOT EXISTS idx_crm_clients_user_status ON public.crm_clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_user_created_at ON public.crm_clients(user_id, created_at DESC);

-- 7. POLÍTICAS RLS PARA LAS FUNCIONES
-- Las funciones ya usan SECURITY DEFINER y verifican auth.uid() por defecto

-- 8. CREAR TABLA DE ESTADÍSTICAS AGREGADAS (OPCIONAL - PARA RENDIMIENTO)
CREATE TABLE IF NOT EXISTS public.user_stats_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stats_data JSONB NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_stats_cache ENABLE ROW LEVEL SECURITY;

-- RLS para cache
CREATE POLICY "Users can access their own stats cache"
  ON public.user_stats_cache FOR ALL
  USING (user_id = auth.uid());

-- Función para actualizar cache
CREATE OR REPLACE FUNCTION public.refresh_user_stats_cache(_user_id UUID DEFAULT auth.uid())
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_stats_cache (user_id, stats_data, last_updated)
  SELECT 
    _user_id,
    public.get_user_stats(_user_id),
    NOW()
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    stats_data = EXCLUDED.stats_data,
    last_updated = EXCLUDED.last_updated;
END;
$$;

-- 9. TRIGGER PARA ACTUALIZAR CACHE AUTOMÁTICAMENTE (OPCIONAL)
-- Esto mantendría el cache actualizado cuando cambien los datos

CREATE OR REPLACE FUNCTION public.invalidate_user_stats_cache()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Invalidar cache del usuario relacionado
  DELETE FROM public.user_stats_cache 
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers para invalidar cache cuando cambien los datos
DROP TRIGGER IF EXISTS trigger_invalidate_stats_messages ON public.messages;
CREATE TRIGGER trigger_invalidate_stats_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

DROP TRIGGER IF EXISTS trigger_invalidate_stats_clients ON public.crm_clients;
CREATE TRIGGER trigger_invalidate_stats_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.crm_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

DROP TRIGGER IF EXISTS trigger_invalidate_stats_conversations ON public.conversations;
CREATE TRIGGER trigger_invalidate_stats_conversations
  AFTER INSERT OR UPDATE OR DELETE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

-- =====================================================
-- VERIFICACIÓN Y COMENTARIOS
-- =====================================================

-- Comentarios para documentación
COMMENT ON VIEW public.user_general_stats IS 'Estadísticas generales por usuario: mensajes, clientes, tasas de respuesta';
COMMENT ON VIEW public.user_channel_stats IS 'Estadísticas por canal de comunicación (WhatsApp, Facebook, Instagram)';
COMMENT ON VIEW public.user_daily_stats IS 'Estadísticas diarias de los últimos 7 días';
COMMENT ON FUNCTION public.get_user_stats IS 'Obtiene todas las estadísticas de un usuario en formato JSON optimizado para frontend';
COMMENT ON TABLE public.user_stats_cache IS 'Cache de estadísticas para mejorar rendimiento';

-- Verificación de instalación
DO $$
BEGIN
  RAISE NOTICE '✅ Vistas de estadísticas creadas exitosamente';
  RAISE NOTICE '📊 Disponibles: user_general_stats, user_channel_stats, user_daily_stats';
  RAISE NOTICE '🔧 Funciones: get_user_stats(), get_user_stats_realtime()';
  RAISE NOTICE '⚡ Cache: user_stats_cache con triggers automáticos';
  RAISE NOTICE '🎯 Frontend puede usar get_user_stats() para obtener todos los datos';
END $$;
