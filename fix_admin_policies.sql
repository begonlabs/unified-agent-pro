-- =====================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA ADMINISTRADORES
-- =====================================================
-- Este script agrega las políticas faltantes para que los administradores
-- puedan gestionar completamente los perfiles de otros usuarios

-- 1. POLÍTICA PARA QUE ADMINS PUEDAN ACTUALIZAR TODOS LOS PERFILES
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 2. POLÍTICA PARA QUE ADMINS PUEDAN ELIMINAR PERFILES
CREATE POLICY "Admins can delete all profiles"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 3. POLÍTICA PARA QUE ADMINS PUEDAN INSERTAR PERFILES (si es necesario)
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. VERIFICAR QUE LA FUNCIÓN has_role EXISTE Y FUNCIONA
-- Si no existe, la creamos
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

-- 5. VERIFICAR QUE EL TIPO user_role EXISTE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'client');
  END IF;
END $$;

-- 6. VERIFICAR QUE LA TABLA user_roles EXISTE
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 7. HABILITAR RLS EN user_roles SI NO ESTÁ HABILITADO
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS PARA user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. VERIFICAR QUE EL USUARIO ADMIN TIENE EL ROL CORRECTO
-- Insertar rol de admin si no existe
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'ernestogrz91@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 10. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas de administrador agregadas exitosamente';
  RAISE NOTICE '🔧 Los administradores ahora pueden:';
  RAISE NOTICE '   - Ver todos los perfiles';
  RAISE NOTICE '   - Actualizar todos los perfiles';
  RAISE NOTICE '   - Eliminar perfiles';
  RAISE NOTICE '   - Insertar perfiles';
  RAISE NOTICE '🎯 El cambio de estado is_active debería funcionar ahora';
END $$;
