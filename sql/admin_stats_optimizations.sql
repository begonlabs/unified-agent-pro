-- Optimización de Estadísticas para el Panel Admin
-- Provee funciones para obtener datos agregados rápidamente

-- 1. Obtener conteo de mensajes por canal para cada usuario
CREATE OR REPLACE FUNCTION public.get_client_message_stats()
RETURNS TABLE (
  user_id UUID,
  channel TEXT,
  count BIGINT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.user_id,
    c.channel,
    COUNT(m.id) as count
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.user_id IS NOT NULL
  GROUP BY c.user_id, c.channel;
$$;

-- 2. Función consolidada para estadísticas de todos los clientes (Panel Admin)
CREATE OR REPLACE FUNCTION public.get_admin_clients_stats()
RETURNS JSON
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT json_agg(stats)
  FROM (
    SELECT 
      p.user_id,
      p.company_name,
      p.email,
      p.plan_type,
      p.is_active,
      COALESCE(ugs.total_messages, 0) as total_messages,
      COALESCE(ugs.total_leads, 0) as total_leads,
      COALESCE(ugs.total_conversations, 0) as total_conversations,
      COALESCE(ugs.response_rate, 0) as response_rate,
      (
        SELECT json_build_object(
          'whatsapp', COALESCE(SUM(count) FILTER (WHERE channel = 'whatsapp'), 0),
          'facebook', COALESCE(SUM(count) FILTER (WHERE channel = 'facebook'), 0),
          'instagram', COALESCE(SUM(count) FILTER (WHERE channel = 'instagram'), 0)
        )
        FROM public.get_client_message_stats() ms
        WHERE ms.user_id = p.user_id
      ) as channel_messages,
      (
        SELECT json_build_object(
          'whatsapp', COUNT(cl.id) FILTER (WHERE cl.source LIKE 'whatsapp%'),
          'facebook', COUNT(cl.id) FILTER (WHERE cl.source LIKE 'facebook%'),
          'instagram', COUNT(cl.id) FILTER (WHERE cl.source LIKE 'instagram%')
        )
        FROM public.crm_clients cl
        WHERE cl.user_id = p.user_id
      ) as channel_leads
    FROM public.profiles p
    LEFT JOIN public.user_general_stats ugs ON p.user_id = ugs.user_id
    ORDER BY p.company_name
  ) stats;
$$;

-- 3. Funciones adicionales para General Stats (Panel Admin)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (
  channel TEXT,
  message_count BIGINT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.channel,
    COUNT(m.id) as message_count
  FROM public.conversations c
  JOIN public.messages m ON c.id = m.conversation_id
  GROUP BY c.channel;
$$;

CREATE OR REPLACE FUNCTION public.get_crm_leads_by_source()
RETURNS TABLE (
  source TEXT,
  count BIGINT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(source, 'direct') as source,
    COUNT(id) as count
  FROM public.crm_clients
  GROUP BY source;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_platform_activity()
RETURNS TABLE (
  date DATE,
  messages BIGINT,
  leads BIGINT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH date_series AS (
    SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval)::date as date
  ),
  daily_msgs AS (
    SELECT created_at::date as date, COUNT(id) as count
    FROM public.messages
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY created_at::date
  ),
  daily_leads AS (
    SELECT created_at::date as date, COUNT(id) as count
    FROM public.crm_clients
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY created_at::date
  )
  SELECT 
    ds.date,
    COALESCE(dm.count, 0) as messages,
    COALESCE(dl.count, 0) as leads
  FROM date_series ds
  LEFT JOIN daily_msgs dm ON ds.date = dm.date
  LEFT JOIN daily_leads dl ON ds.date = dl.date
  ORDER BY ds.date;
$$;
