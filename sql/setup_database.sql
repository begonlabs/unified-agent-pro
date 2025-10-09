
-- Migración base: Crear todas las tablas principales
-- Basado en: supabase/migrations/20250618221137-1a5afa22-2094-4684-8720-f2fe9f38078d.sql

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free',
  subscription_start DATE DEFAULT now(),
  subscription_end DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de clientes/leads del CRM
CREATE TABLE public.crm_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'lead', -- lead, active, inactive
  tags TEXT[],
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de conversaciones
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES public.crm_clients(id),
  channel TEXT NOT NULL, -- whatsapp, facebook, instagram
  channel_thread_id TEXT,
  status TEXT DEFAULT 'open', -- open, closed, pending
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de mensajes
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) NOT NULL,
  content TEXT NOT NULL,
  sender_type TEXT NOT NULL, -- client, ai, human
  sender_name TEXT,
  is_automated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de configuración de IA
CREATE TABLE public.ai_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  goals TEXT,
  restrictions TEXT,
  common_questions TEXT,
  response_time INTEGER DEFAULT 30, -- segundos
  knowledge_base TEXT,
  faq TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de canales de comunicación
CREATE TABLE public.communication_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  channel_type TEXT NOT NULL, -- whatsapp, facebook, instagram
  channel_config JSONB,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de estadísticas
CREATE TABLE public.statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  channel TEXT NOT NULL,
  total_messages INTEGER DEFAULT 0,
  automated_messages INTEGER DEFAULT 0,
  human_messages INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  new_leads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para crm_clients
CREATE POLICY "Users can view their own clients" ON public.crm_clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own clients" ON public.crm_clients FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para conversations
CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para messages
CREATE POLICY "Users can view messages from their conversations" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);
CREATE POLICY "Users can insert messages to their conversations" ON public.messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

-- Políticas RLS para ai_configurations
CREATE POLICY "Users can manage their own AI config" ON public.ai_configurations FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para communication_channels
CREATE POLICY "Users can manage their own channels" ON public.communication_channels FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para statistics
CREATE POLICY "Users can view their own statistics" ON public.statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own statistics" ON public.statistics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Mi Empresa'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
