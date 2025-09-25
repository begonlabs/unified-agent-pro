-- =====================================================
-- CORRECCIÓN DEL TRIGGER updated_at PARA PROFILES
-- =====================================================
-- Este script agrega el trigger faltante para actualizar automáticamente
-- el campo updated_at cuando se modifica un perfil

-- 1. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TRIGGER PARA updated_at EN PROFILES
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. VERIFICAR QUE EL CAMPO updated_at EXISTE EN PROFILES
-- Si no existe, lo agregamos
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
  END IF;
END $$;

-- 4. VERIFICAR QUE EL CAMPO is_active EXISTE EN PROFILES
-- Si no existe, lo agregamos
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
  END IF;
END $$;

-- 5. VERIFICACIÓN FINAL
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger updated_at agregado exitosamente';
  RAISE NOTICE '🔧 El campo updated_at se actualizará automáticamente';
  RAISE NOTICE '🎯 Los cambios en is_active ahora deberían persistir correctamente';
END $$;
