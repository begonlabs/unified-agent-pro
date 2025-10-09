-- =====================================================
-- DIAGNÓSTICO DE LA BASE DE DATOS
-- =====================================================
-- Este script verifica el estado actual de las tablas y políticas

-- 1. VERIFICAR ESTRUCTURA DE LA TABLA PROFILES
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR POLÍTICAS RLS DE PROFILES
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND schemaname = 'public'
ORDER BY policyname;

-- 3. VERIFICAR SI EXISTE LA FUNCIÓN has_role
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_name = 'has_role' 
  AND routine_schema = 'public';

-- 4. VERIFICAR SI EXISTE EL TIPO user_role
SELECT 
  typname,
  typtype,
  enumlabel
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'user_role';

-- 5. VERIFICAR SI EXISTE LA TABLA user_roles
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'user_roles' 
  AND table_schema = 'public';

-- 6. VERIFICAR ROLES DE USUARIOS
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'ernestogrz91@gmail.com';

-- 7. VERIFICAR TRIGGERS EN PROFILES
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
  AND event_object_schema = 'public';

-- 8. VERIFICAR ALGUNOS PERFILES DE PRUEBA
SELECT 
  id,
  user_id,
  company_name,
  email,
  is_active,
  created_at,
  updated_at
FROM public.profiles 
LIMIT 5;

-- 9. VERIFICAR SI RLS ESTÁ HABILITADO EN PROFILES
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles' 
  AND schemaname = 'public';
