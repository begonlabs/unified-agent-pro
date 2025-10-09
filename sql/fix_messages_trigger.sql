-- =====================================================
-- FIX: Corregir trigger que causa error 'user_id' en tabla messages
-- =====================================================

-- El problema es que el trigger invalidate_user_stats_cache() está intentando 
-- acceder a NEW.user_id y OLD.user_id en la tabla messages, pero esa tabla
-- no tiene un campo user_id (está en conversations)

-- 1. CORREGIR LA FUNCIÓN DE TRIGGER
CREATE OR REPLACE FUNCTION public.invalidate_user_stats_cache()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Manejar diferentes tablas según el contexto
  IF TG_TABLE_NAME = 'messages' THEN
    -- Para mensajes, obtener user_id desde conversations
    IF TG_OP = 'DELETE' THEN
      -- En DELETE, usar OLD.conversation_id
      SELECT c.user_id INTO target_user_id
      FROM public.conversations c
      WHERE c.id = OLD.conversation_id;
    ELSE
      -- En INSERT/UPDATE, usar NEW.conversation_id
      SELECT c.user_id INTO target_user_id
      FROM public.conversations c
      WHERE c.id = NEW.conversation_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'conversations' THEN
    -- Para conversations, usar directamente el user_id
    target_user_id = COALESCE(NEW.user_id, OLD.user_id);
  ELSIF TG_TABLE_NAME = 'crm_clients' THEN
    -- Para crm_clients, usar directamente el user_id
    target_user_id = COALESCE(NEW.user_id, OLD.user_id);
  END IF;

  -- Solo invalidar si encontramos un user_id válido
  IF target_user_id IS NOT NULL THEN
    DELETE FROM public.user_stats_cache 
    WHERE user_id = target_user_id;
    
    -- Log para debugging (opcional)
    RAISE LOG 'Cache invalidated for user_id: % from table: %', target_user_id, TG_TABLE_NAME;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. RECREAR LOS TRIGGERS CON LA FUNCIÓN CORREGIDA

-- Trigger para messages (el problemático)
DROP TRIGGER IF EXISTS trigger_invalidate_stats_messages ON public.messages;
CREATE TRIGGER trigger_invalidate_stats_messages
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

-- Trigger para conversations (mantener igual)
DROP TRIGGER IF EXISTS trigger_invalidate_stats_conversations ON public.conversations;
CREATE TRIGGER trigger_invalidate_stats_conversations
  AFTER INSERT OR UPDATE OR DELETE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

-- Trigger para crm_clients (mantener igual)
DROP TRIGGER IF EXISTS trigger_invalidate_stats_clients ON public.crm_clients;
CREATE TRIGGER trigger_invalidate_stats_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.crm_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_user_stats_cache();

-- 3. VERIFICAR QUE LA FUNCIÓN FUNCIONE CORRECTAMENTE
-- Test básico (descomenta solo si quieres probar manualmente):
-- DO $$
-- DECLARE
--   test_conversation_id UUID;
--   test_user_id UUID;
-- BEGIN
--   -- Buscar una conversación existente
--   SELECT id, user_id INTO test_conversation_id, test_user_id
--   FROM public.conversations 
--   LIMIT 1;
--   
--   IF test_conversation_id IS NOT NULL THEN
--     -- Insertar mensaje de prueba para verificar que el trigger funciona
--     INSERT INTO public.messages (conversation_id, content, sender_type, sender_name)
--     VALUES (test_conversation_id, 'Test trigger message', 'agent', 'Test Agent');
--     
--     RAISE NOTICE 'Test message inserted successfully for user: %', test_user_id;
--     
--     -- Limpiar mensaje de prueba
--     DELETE FROM public.messages 
--     WHERE content = 'Test trigger message' AND conversation_id = test_conversation_id;
--     
--     RAISE NOTICE 'Test message deleted successfully';
--   ELSE
--     RAISE NOTICE 'No conversations found for testing';
--   END IF;
-- END $$;

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.invalidate_user_stats_cache() IS 
'Trigger function que invalida el cache de estadísticas cuando cambian los datos. 
Maneja correctamente el user_id para diferentes tablas:
- messages: obtiene user_id desde conversations via conversation_id
- conversations: usa user_id directo
- crm_clients: usa user_id directo';

-- Log de la corrección
SELECT 'Trigger corregido exitosamente - los errores de user_id en messages deberían resolverse' as status;