-- =====================================================
-- CORRECCIÓN COMPLETA PARA GESTIÓN DE CLIENTES
-- =====================================================
-- Este script corrige todos los problemas identificados para que
-- el cambio de estado is_active funcione correctamente

-- 1. VERIFICAR Y CREAR EL TIPO user_role SI NO EXISTE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'client');
    RAISE NOTICE '✅ Tipo user_role creado';
  ELSE
    RAISE NOTICE '✅ Tipo user_role ya existe';
  END IF;
END $$;

-- 2. VERIFICAR Y CREAR LA TABLA user_roles SI NO EXISTE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 3. HABILITAR RLS EN user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. CREAR/ACTUALIZAR LA FUNCIÓN has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. VERIFICAR QUE EL CAMPO is_active EXISTE EN PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_active'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Campo is_active agregado a profiles';
  ELSE
    RAISE NOTICE '✅ Campo is_active ya existe en profiles';
  END IF;
END $$;

-- 6. VERIFICAR QUE EL CAMPO updated_at EXISTE EN PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    RAISE NOTICE '✅ Campo updated_at agregado a profiles';
  ELSE
    RAISE NOTICE '✅ Campo updated_at ya existe en profiles';
  END IF;
END $$;

-- 7. CREAR FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. CREAR TRIGGER PARA updated_at EN PROFILES
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. ELIMINAR POLÍTICAS CONFLICTIVAS EXISTENTES
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- 10. CREAR POLÍTICAS RLS CORRECTAS PARA PROFILES

-- Política para que usuarios vean su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que admins vean todos los perfiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Política para que admins actualicen todos los perfiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Política para que admins eliminen perfiles
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Política para que admins inserten perfiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 11. CREAR POLÍTICAS PARA user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. ASEGURAR QUE EL USUARIO ADMIN TIENE EL ROL CORRECTO
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'ernestogrz91@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 13. VERIFICACIÓN FINAL
DO $$
DECLARE
  admin_count INTEGER;
  profiles_count INTEGER;
  policies_count INTEGER;
BEGIN
  -- Contar administradores
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles 
  WHERE role = 'admin';
  
  -- Contar perfiles
  SELECT COUNT(*) INTO profiles_count
  FROM public.profiles;
  
  -- Contar políticas de profiles
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies 
  WHERE tablename = 'profiles' AND schemaname = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECCIÓN COMPLETA FINALIZADA';
  RAISE NOTICE '========================================';
  RAISE NOTICE '👥 Administradores encontrados: %', admin_count;
  RAISE NOTICE '👤 Perfiles en la base de datos: %', profiles_count;
  RAISE NOTICE '🔒 Políticas RLS de profiles: %', policies_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 El cambio de estado is_active debería funcionar ahora';
  RAISE NOTICE '🔧 Los administradores pueden gestionar todos los perfiles';
  RAISE NOTICE '⚡ El campo updated_at se actualiza automáticamente';
  RAISE NOTICE '========================================';
END $$;
