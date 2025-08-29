-- =====================================================
-- SCRIPT DE VERIFICACIÓN DEL ESTADO DE LA BASE DE DATOS
-- Ejecuta esto primero para ver qué necesitas
-- =====================================================

-- 1. VERIFICAR TABLAS PRINCIPALES
SELECT 
  'Verificación de Tablas' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') 
    THEN '✅ conversations existe'
    ELSE '❌ conversations falta'
  END as conversations_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') 
    THEN '✅ messages existe'
    ELSE '❌ messages falta'
  END as messages_table,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_clients' AND table_schema = 'public') 
    THEN '✅ crm_clients existe'
    ELSE '❌ crm_clients falta'
  END as crm_clients_table;

-- 2. VERIFICAR CAMPOS NECESARIOS PARA REALTIME
SELECT 
  'Verificación de Campos' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'platform_message_id' AND table_schema = 'public') 
    THEN '✅ platform_message_id existe'
    ELSE '❌ platform_message_id falta - ejecuta update.sql'
  END as platform_message_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'metadata' AND table_schema = 'public') 
    THEN '✅ metadata existe'
    ELSE '❌ metadata falta - ejecuta update.sql'
  END as metadata_field,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_clients' AND column_name = 'source' AND table_schema = 'public') 
    THEN '✅ source existe'
    ELSE '❌ source falta - ejecuta update.sql'
  END as source_field;

-- 3. VERIFICAR ÍNDICES BÁSICOS
SELECT 
  'Verificación de Índices Básicos' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_conversations_user_id' AND tablename = 'conversations') 
    THEN '✅ idx_conversations_user_id existe'
    ELSE '❌ idx_conversations_user_id falta'
  END as conversations_user_index,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation_id' AND tablename = 'messages') 
    THEN '✅ idx_messages_conversation_id existe'
    ELSE '❌ idx_messages_conversation_id falta'
  END as messages_conversation_index;

-- 4. VERIFICAR POLÍTICAS RLS
SELECT 
  'Verificación RLS' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname LIKE '%policy%') 
    THEN '✅ Políticas RLS para conversations'
    ELSE '❌ Faltan políticas RLS para conversations'
  END as conversations_rls,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname LIKE '%policy%') 
    THEN '✅ Políticas RLS para messages'
    ELSE '❌ Faltan políticas RLS para messages'
  END as messages_rls;

-- 5. VERIFICAR ESTADO DE REALTIME (esto solo funciona si ya está habilitado)
-- Nota: Para verificar completamente necesitas acceso al Dashboard de Supabase
SELECT 
  'Estado de Realtime' as check_type,
  'ℹ️  Verifica en Dashboard: Database > Replication' as realtime_status,
  'ℹ️  Tablas necesarias: conversations, messages, crm_clients' as required_tables;

-- 6. VERIFICAR FUNCIONES NECESARIAS
SELECT 
  'Verificación de Funciones' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') 
    THEN '✅ Función has_role existe'
    ELSE '❌ Función has_role falta - ejecuta setup_user_tables.sql'
  END as has_role_function;

-- 7. RESUMEN DE ACCIONES REQUERIDAS
SELECT 
  '📋 Resumen de Acciones' as action_summary,
  '1. Si faltan tablas básicas: ejecuta setup_user_tables.sql y setup_app_tables.sql' as step_1,
  '2. Si faltan campos nuevos: ejecuta update.sql' as step_2,
  '3. Para optimizar Realtime: ejecuta setup_realtime_optimizations.sql' as step_3,
  '4. En Dashboard Supabase: habilita Realtime para las tablas' as step_4;

-- =====================================================
-- BONUS: ESTADÍSTICAS DE TU CONTENIDO ACTUAL
-- =====================================================

-- Solo si las tablas existen, mostrar estadísticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
    RAISE NOTICE '📊 ESTADÍSTICAS ACTUALES:';
    RAISE NOTICE 'Conversaciones totales: %', (SELECT COUNT(*) FROM public.conversations);
    RAISE NOTICE 'Mensajes totales: %', (SELECT COUNT(*) FROM public.messages);
    RAISE NOTICE 'Clientes CRM: %', (SELECT COUNT(*) FROM public.crm_clients);
  ELSE
    RAISE NOTICE 'ℹ️  Las tablas aún no existen. Ejecuta los scripts de setup primero.';
  END IF;
END $$;
