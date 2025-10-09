-- =====================================================
-- HABILITAR REALTIME PARA LAS TABLAS PRINCIPALES
-- Ejecuta esto en el SQL Editor de Supabase
-- =====================================================

-- 1. HABILITAR REALTIME PARA CONVERSATIONS
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 2. HABILITAR REALTIME PARA MESSAGES  
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. HABILITAR REALTIME PARA CRM_CLIENTS (opcional pero recomendado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_clients;

-- =====================================================
-- VERIFICAR QUE SE HABILITARON CORRECTAMENTE
-- =====================================================

-- Ver qué tablas tienen Realtime habilitado
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado ✅' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'crm_clients')
ORDER BY tablename;

-- Si no aparecen todas las tablas, significa que falta habilitarlas

-- =====================================================
-- INFORMACIÓN ADICIONAL
-- =====================================================

/*
📊 QUÉ HACE CADA TABLA EN REALTIME:

🔄 conversations: 
   - Nuevas conversaciones aparecen instantáneamente
   - Cambios de estado (abierto/cerrado) en tiempo real
   - Actualizaciones de última actividad

💬 messages:
   - Mensajes nuevos llegan sin recargar
   - Estados de envío se actualizan automáticamente
   - Indicadores de "escribiendo" funcionales

👥 crm_clients:
   - Nuevos clientes se sincronizan inmediatamente
   - Cambios de status se reflejan al instante
   - Información actualizada sin polling

🎯 RESULTADO: Tu chat funcionará como WhatsApp Web - TODO EN TIEMPO REAL!
*/
