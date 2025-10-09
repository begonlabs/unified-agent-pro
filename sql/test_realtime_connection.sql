-- =====================================================
-- SCRIPT PARA PROBAR QUE REALTIME ESTÁ FUNCIONANDO
-- Ejecuta después de habilitar las tablas
-- =====================================================

-- 1. VERIFICAR QUE LAS TABLAS ESTÁN HABILITADAS PARA REALTIME
SELECT 
  '🔍 VERIFICACIÓN DE REALTIME' as test_section,
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
    ) 
    THEN '✅ Realtime habilitado'
    ELSE '❌ Realtime NO habilitado'
  END as realtime_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('conversations', 'messages', 'crm_clients')
ORDER BY table_name;

-- 2. INSERTAR DATOS DE PRUEBA (si no tienes)
-- SOLO ejecuta si no tienes datos existentes

-- Crear un cliente de prueba
INSERT INTO public.crm_clients (user_id, name, email, phone, status, source)
SELECT 
  auth.uid(),
  'Cliente Prueba Realtime',
  'prueba@realtime.com',
  '+1234567890',
  'lead',
  'manual'
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_clients 
    WHERE name = 'Cliente Prueba Realtime' AND user_id = auth.uid()
  );

-- Crear una conversación de prueba
INSERT INTO public.conversations (user_id, client_id, channel, status)
SELECT 
  auth.uid(),
  c.id,
  'whatsapp',
  'open'
FROM public.crm_clients c
WHERE c.name = 'Cliente Prueba Realtime' 
  AND c.user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE client_id = c.id AND user_id = auth.uid()
  );

-- Insertar un mensaje de prueba
INSERT INTO public.messages (conversation_id, content, sender_type, sender_name, is_automated)
SELECT 
  conv.id,
  '🚀 ¡Realtime está funcionando! Mensaje enviado a las ' || CURRENT_TIMESTAMP::text,
  'human',
  'Sistema',
  false
FROM public.conversations conv
JOIN public.crm_clients c ON conv.client_id = c.id
WHERE c.name = 'Cliente Prueba Realtime' 
  AND c.user_id = auth.uid()
  AND conv.user_id = auth.uid();

-- 3. OBTENER INFORMACIÓN PARA PROBAR EN TU APP
SELECT 
  '📱 DATOS PARA PROBAR EN TU APP' as test_section,
  'conversation_id: ' || conv.id as conversation_info,
  'client_name: ' || c.name as client_info,
  'channel: ' || conv.channel as channel_info,
  'user_id: ' || conv.user_id as user_info
FROM public.conversations conv
JOIN public.crm_clients c ON conv.client_id = c.id
WHERE c.name = 'Cliente Prueba Realtime' 
  AND c.user_id = auth.uid()
  AND conv.user_id = auth.uid()
LIMIT 1;

-- 4. CONSULTA PARA VER MENSAJES RECIENTES
SELECT 
  '💬 MENSAJES RECIENTES' as test_section,
  m.content,
  m.sender_type,
  m.created_at,
  c.name as client_name
FROM public.messages m
JOIN public.conversations conv ON m.conversation_id = conv.id
JOIN public.crm_clients c ON conv.client_id = c.id
WHERE conv.user_id = auth.uid()
ORDER BY m.created_at DESC
LIMIT 5;

-- =====================================================
-- INSTRUCCIONES PARA PROBAR EN TU APP
-- =====================================================

/*
🧪 CÓMO PROBAR QUE REALTIME FUNCIONA:

1. **Ejecuta este script** para crear datos de prueba

2. **Abre tu app React** y ve a la sección de mensajes

3. **Abre el SQL Editor de Supabase** en otra pestaña

4. **Ejecuta este comando para simular un mensaje nuevo:**
   ```sql
   INSERT INTO public.messages (conversation_id, content, sender_type, sender_name, is_automated)
   SELECT 
     conv.id,
     '🎉 ¡Mensaje de prueba desde SQL! ' || CURRENT_TIMESTAMP::text,
     'client',
     'Prueba Realtime',
     false
   FROM public.conversations conv
   JOIN public.crm_clients c ON conv.client_id = c.id
   WHERE c.name = 'Cliente Prueba Realtime' 
     AND c.user_id = auth.uid()
   LIMIT 1;
   ```

5. **¡El mensaje debería aparecer INSTANTÁNEAMENTE en tu app!** 🚀

6. **Si no aparece instantáneamente:**
   - ✅ Verifica que habilitaste las tablas en Database > Replication
   - ✅ Revisa la consola del navegador por errores
   - ✅ Confirma que estás usando los nuevos hooks useRealtimeConversations y useRealtimeMessages

📊 TAMBIÉN PUEDES PROBAR:
- Crear nuevas conversaciones desde SQL (aparecerán en la lista)
- Cambiar status de conversaciones (se actualizará automáticamente)
- Crear nuevos clientes (se sincronizarán al instante)

🎯 SI TODO FUNCIONA: ¡Tu sistema Realtime está perfectamente configurado!
*/
