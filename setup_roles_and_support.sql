
-- Migración de roles y soporte
-- Basado en: supabase/migrations/20250618223012-1d4ded80-5767-4927-80b0-f3ed2d3b5651.sql

-- Crear tabla para roles de usuario
CREATE TYPE public.user_role AS ENUM ('admin', 'client');

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Función para verificar si un usuario tiene un rol específico
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

-- Políticas para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Crear tabla para mensajes de soporte
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para support_messages
CREATE POLICY "Users can view their own support messages"
  ON public.support_messages
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own support messages"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all support messages"
  ON public.support_messages
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Actualizar función para crear usuarios automáticamente incluyendo roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insertar perfil
  INSERT INTO public.profiles (user_id, company_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Mi Empresa'),
    NEW.email
  );
  
  -- Insertar rol (por defecto cliente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;

-- Actualizar estadísticas para incluir información de administración
ALTER TABLE public.statistics 
ADD COLUMN IF NOT EXISTS leads_converted INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_response_time INTEGER DEFAULT 0;

-- Vista para estadísticas generales de administración
CREATE OR REPLACE VIEW public.admin_general_stats AS
SELECT 
  COUNT(DISTINCT p.user_id) as total_clients,
  COUNT(DISTINCT CASE WHEN p.plan_type = 'free' THEN p.user_id END) as free_clients,
  COUNT(DISTINCT CASE WHEN p.plan_type = 'premium' THEN p.user_id END) as premium_clients,
  COUNT(DISTINCT CASE WHEN p.plan_type = 'enterprise' THEN p.user_id END) as enterprise_clients,
  COALESCE(SUM(s.total_messages), 0) as total_messages_platform,
  COALESCE(SUM(s.new_leads), 0) as total_leads_platform,
  COALESCE(SUM(CASE WHEN s.channel = 'whatsapp' THEN s.total_messages ELSE 0 END), 0) as whatsapp_messages,
  COALESCE(SUM(CASE WHEN s.channel = 'facebook' THEN s.total_messages ELSE 0 END), 0) as facebook_messages,
  COALESCE(SUM(CASE WHEN s.channel = 'instagram' THEN s.total_messages ELSE 0 END), 0) as instagram_messages,
  COALESCE(SUM(CASE WHEN s.channel = 'whatsapp' THEN s.new_leads ELSE 0 END), 0) as whatsapp_leads,
  COALESCE(SUM(CASE WHEN s.channel = 'facebook' THEN s.new_leads ELSE 0 END), 0) as facebook_leads,
  COALESCE(SUM(CASE WHEN s.channel = 'instagram' THEN s.new_leads ELSE 0 END), 0) as instagram_leads
FROM public.profiles p
LEFT JOIN public.statistics s ON p.user_id = s.user_id;
