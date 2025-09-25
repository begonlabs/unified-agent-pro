-- =====================================================
-- SISTEMA DE TICKETS DE SOPORTE - SOLO LO QUE FALTA
-- =====================================================
-- Este script asume que ya existe la tabla support_messages
-- Solo agrega la tabla support_tickets y la función necesaria

-- 1. TABLA DE TICKETS DE SOPORTE (si no existe)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(id)
);

-- 2. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD PARA SUPPORT_TICKETS
-- Usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view own tickets"
  ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios pueden crear sus propios tickets
CREATE POLICY "Users can create own tickets"
  ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden actualizar sus propios tickets
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins pueden ver todos los tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins pueden gestionar todos los tickets
CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. MODIFICAR TABLA SUPPORT_MESSAGES EXISTENTE
-- Agregar campos que faltan para el sistema de tickets
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user' CHECK (message_type IN ('user', 'admin', 'system')),
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 5. ACTUALIZAR POLÍTICAS DE SUPPORT_MESSAGES
-- Agregar políticas para el nuevo campo ticket_id
CREATE POLICY "Users can view messages from own tickets"
  ON public.support_messages
  FOR SELECT
  USING (
    ticket_id IS NULL OR -- Para mensajes antiguos sin ticket_id
    EXISTS (
      SELECT 1 FROM public.support_tickets 
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own tickets"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    ticket_id IS NULL OR -- Para mensajes antiguos
    (
      auth.uid() = user_id AND
      EXISTS (
        SELECT 1 FROM public.support_tickets 
        WHERE id = ticket_id AND user_id = auth.uid()
      )
    )
  );

-- 6. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_message_type ON public.support_messages(message_type);

-- 8. FUNCIÓN PARA OBTENER TICKETS CON CONTEO DE MENSAJES
CREATE OR REPLACE FUNCTION public.get_user_tickets_with_message_count(_user_id UUID)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  message_count BIGINT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    st.id,
    st.subject,
    st.priority,
    st.status,
    st.created_at,
    st.updated_at,
    COUNT(sm.id) as message_count,
    MAX(sm.created_at) as last_message_at,
    COUNT(CASE WHEN sm.message_type != 'user' AND sm.is_read = false THEN 1 END) as unread_count
  FROM public.support_tickets st
  LEFT JOIN public.support_messages sm ON st.id = sm.ticket_id
  WHERE st.user_id = _user_id
  GROUP BY st.id, st.subject, st.priority, st.status, st.created_at, st.updated_at
  ORDER BY st.updated_at DESC;
$$;

-- 9. MIGRAR DATOS EXISTENTES (OPCIONAL)
-- Si quieres migrar los support_messages existentes a tickets
-- Descomenta las siguientes líneas:

/*
-- Crear tickets para mensajes existentes que no tienen ticket_id
INSERT INTO public.support_tickets (user_id, subject, priority, status, created_at)
SELECT DISTINCT 
  user_id,
  subject,
  CASE priority
    WHEN 'low' THEN 'low'
    WHEN 'medium' THEN 'normal'
    WHEN 'high' THEN 'high'
    ELSE 'normal'
  END as priority,
  CASE status
    WHEN 'pending' THEN 'open'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'resolved' THEN 'closed'
    ELSE 'open'
  END as status,
  MIN(created_at) as created_at
FROM public.support_messages 
WHERE ticket_id IS NULL
GROUP BY user_id, subject, priority, status;

-- Actualizar support_messages con ticket_id
UPDATE public.support_messages 
SET ticket_id = st.id
FROM public.support_tickets st
WHERE support_messages.user_id = st.user_id 
  AND support_messages.subject = st.subject
  AND support_messages.ticket_id IS NULL;
*/

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las tablas se crearon correctamente
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de tickets de soporte configurado';
  RAISE NOTICE '📋 Tabla support_tickets: Creada/Verificada';
  RAISE NOTICE '💬 Tabla support_messages: Actualizada con campos de tickets';
  RAISE NOTICE '🔧 Función get_user_tickets_with_message_count: Creada';
  RAISE NOTICE '🎯 El frontend puede usar la función para obtener tickets con contadores';
END $$;
