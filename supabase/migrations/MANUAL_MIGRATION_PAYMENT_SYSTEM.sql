-- =====================================================
-- MIGRACIÓN MANUAL: SISTEMA DE PAGOS Y SUSCRIPCIONES
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- PASO 1: AGREGAR CAMPOS A LA TABLA PROFILES
-- =====================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('trial', 'pending', 'active', 'expired', 'cancelled'));

-- PASO 2: CREAR TABLA DE PAGOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basico', 'avanzado', 'pro')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  dlocalgo_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method TEXT,
  payment_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_dlocalgo_payment_id UNIQUE (dlocalgo_payment_id)
);

-- PASO 3: CREAR TABLA DE SUSCRIPCIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basico', 'avanzado', 'pro')),
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PASO 4: HABILITAR ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PASO 5: POLÍTICAS DE SEGURIDAD PARA PAYMENTS
-- =====================================================
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- PASO 6: POLÍTICAS DE SEGURIDAD PARA SUBSCRIPTIONS
-- =====================================================
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- PASO 7: ACTUALIZAR FUNCIÓN HANDLE_NEW_USER
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trial_start TIMESTAMP WITH TIME ZONE;
  trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
  trial_start := now();
  trial_end := now() + INTERVAL '7 days';
  
  INSERT INTO public.profiles (
    user_id, 
    company_name, 
    email,
    plan_type,
    is_trial,
    trial_start_date,
    trial_end_date,
    payment_status,
    subscription_start
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Mi Empresa'),
    NEW.email,
    'free',
    true,
    trial_start,
    trial_end,
    'trial',
    trial_start
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    start_date,
    end_date,
    is_active
  )
  VALUES (
    NEW.id,
    'free',
    trial_start,
    trial_end,
    true
  );
  
  RETURN NEW;
END;
$$;

-- PASO 8: FUNCIÓN PARA VERIFICAR EXPIRACIÓN DE TRIAL
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_trial_expiration()
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_trial = false,
    payment_status = 'expired',
    is_active = false
  WHERE 
    is_trial = true 
    AND trial_end_date < now()
    AND payment_status = 'trial';
    
  UPDATE public.subscriptions
  SET is_active = false
  WHERE 
    plan_type = 'free'
    AND end_date < now()
    AND is_active = true;
END;
$$;

-- PASO 9: FUNCIÓN PARA ACTIVAR PLAN DESPUÉS DE PAGO
-- =====================================================
CREATE OR REPLACE FUNCTION public.activate_paid_plan(
  p_user_id UUID,
  p_plan_type TEXT,
  p_payment_id UUID
)
RETURNS void
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.subscriptions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;
  
  UPDATE public.profiles
  SET 
    plan_type = p_plan_type,
    is_trial = false,
    payment_status = 'active',
    is_active = true,
    subscription_start = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    payment_id,
    start_date,
    is_active
  )
  VALUES (
    p_user_id,
    p_plan_type,
    p_payment_id,
    now(),
    true
  );
END;
$$;

-- PASO 10: ÍNDICES PARA MEJOR RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_dlocalgo_id ON public.payments(dlocalgo_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial ON public.profiles(is_trial);
CREATE INDEX IF NOT EXISTS idx_profiles_payment_status ON public.profiles(payment_status);

-- PASO 11: TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================

-- VERIFICACIÓN: Ejecuta estas queries para confirmar
SELECT 'Tabla payments creada' as status, COUNT(*) as count FROM public.payments;
SELECT 'Tabla subscriptions creada' as status, COUNT(*) as count FROM public.subscriptions;
SELECT 'Campos agregados a profiles' as status, 
       column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('trial_start_date', 'trial_end_date', 'is_trial', 'payment_status');
