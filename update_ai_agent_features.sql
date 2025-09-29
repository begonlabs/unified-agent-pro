-- =====================================================
-- ACTUALIZACIÓN DE FUNCIONALIDADES DEL AGENTE IA
-- Agregar: Asesor, Estado de entrenamiento mejorado, Horarios de funcionamiento
-- =====================================================

-- 1. AGREGAR NUEVOS CAMPOS A AI_CONFIGURATIONS
ALTER TABLE public.ai_configurations 
ADD COLUMN IF NOT EXISTS advisor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS advisor_message TEXT DEFAULT 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.',
ADD COLUMN IF NOT EXISTS always_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{"monday": {"enabled": true, "start": "09:00", "end": "18:00"}, "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"}, "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"}, "thursday": {"enabled": true, "start": "09:00", "end": "18:00"}, "friday": {"enabled": true, "start": "09:00", "end": "18:00"}, "saturday": {"enabled": true, "start": "09:00", "end": "18:00"}, "sunday": {"enabled": true, "start": "09:00", "end": "18:00"}}',
ADD COLUMN IF NOT EXISTS training_progress JSONB DEFAULT '{"goals": false, "restrictions": false, "knowledge_base": false, "faq": false, "advisor": false, "schedule": false}';

-- 2. CREAR TABLA PARA HISTORIAL DE CONFIGURACIÓN (OPCIONAL)
CREATE TABLE IF NOT EXISTS public.ai_config_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES public.ai_configurations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_config_history ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_config_history
CREATE POLICY "Users can view their own config history"
  ON public.ai_config_history FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own config history"
  ON public.ai_config_history FOR INSERT
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- 3. FUNCIÓN PARA CALCULAR PROGRESO DE ENTRENAMIENTO
CREATE OR REPLACE FUNCTION public.calculate_training_progress(_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'goals', CASE WHEN goals IS NOT NULL AND trim(goals) != '' THEN true ELSE false END,
    'restrictions', CASE WHEN restrictions IS NOT NULL AND trim(restrictions) != '' THEN true ELSE false END,
    'knowledge_base', CASE WHEN knowledge_base IS NOT NULL AND trim(knowledge_base) != '' THEN true ELSE false END,
    'faq', CASE WHEN faq IS NOT NULL AND trim(faq) != '' THEN true ELSE false END,
    'advisor', CASE WHEN advisor_enabled = true AND advisor_message IS NOT NULL AND trim(advisor_message) != '' THEN true ELSE false END,
    'schedule', CASE WHEN always_active = true OR (operating_hours IS NOT NULL AND operating_hours != '{}'::jsonb) THEN true ELSE false END
  )
  FROM public.ai_configurations
  WHERE user_id = _user_id;
$$;

-- 4. FUNCIÓN PARA VERIFICAR SI EL AGENTE DEBE RESPONDER SEGÚN HORARIOS
CREATE OR REPLACE FUNCTION public.is_agent_active_now(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
AS $$
DECLARE
  config_record RECORD;
  current_day TEXT;
  current_time_str TEXT;
  day_config JSONB;
BEGIN
  -- Obtener configuración del usuario
  SELECT always_active, operating_hours
  INTO config_record
  FROM public.ai_configurations
  WHERE user_id = _user_id;
  
  -- Si no hay configuración, permitir respuesta
  IF NOT FOUND THEN
    RETURN true;
  END IF;
  
  -- Si está configurado para estar siempre activo
  IF config_record.always_active = true THEN
    RETURN true;
  END IF;
  
  -- Verificar horarios específicos
  current_day := lower(to_char(now(), 'day'));
  current_time_str := to_char(now(), 'HH24:MI');
  
  -- Obtener configuración del día actual
  day_config := config_record.operating_hours->current_day;
  
  -- Si el día no está habilitado
  IF (day_config->>'enabled')::boolean = false THEN
    RETURN false;
  END IF;
  
  -- Verificar si estamos dentro del horario
  RETURN current_time_str >= (day_config->>'start') AND current_time_str <= (day_config->>'end');
END;
$$;

-- 5. FUNCIÓN PARA OBTENER MENSAJE DE ASESOR
CREATE OR REPLACE FUNCTION public.get_advisor_message(_user_id UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(advisor_message, 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.')
  FROM public.ai_configurations
  WHERE user_id = _user_id AND advisor_enabled = true;
$$;

-- 6. TRIGGER PARA ACTUALIZAR PROGRESO AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.update_training_progress()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  -- Actualizar el campo training_progress cuando cambie la configuración
  NEW.training_progress := public.calculate_training_progress(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_update_training_progress ON public.ai_configurations;
CREATE TRIGGER trigger_update_training_progress
  BEFORE INSERT OR UPDATE ON public.ai_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_training_progress();

-- 7. ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_ai_configurations_advisor ON public.ai_configurations(user_id, advisor_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_always_active ON public.ai_configurations(user_id, always_active);

-- 8. ACTUALIZAR CONFIGURACIONES EXISTENTES CON VALORES POR DEFECTO
UPDATE public.ai_configurations 
SET 
  advisor_enabled = false,
  advisor_message = 'Por favor, espere un momento mientras conecto con un agente humano para asistirle mejor.',
  always_active = true,
  operating_hours = '{"monday": {"enabled": true, "start": "09:00", "end": "18:00"}, "tuesday": {"enabled": true, "start": "09:00", "end": "18:00"}, "wednesday": {"enabled": true, "start": "09:00", "end": "18:00"}, "thursday": {"enabled": true, "start": "09:00", "end": "18:00"}, "friday": {"enabled": true, "start": "09:00", "end": "18:00"}, "saturday": {"enabled": true, "start": "09:00", "end": "18:00"}, "sunday": {"enabled": true, "start": "09:00", "end": "18:00"}}',
  training_progress = jsonb_build_object(
    'goals', CASE WHEN goals IS NOT NULL AND trim(goals) != '' THEN true ELSE false END,
    'restrictions', CASE WHEN restrictions IS NOT NULL AND trim(restrictions) != '' THEN true ELSE false END,
    'knowledge_base', CASE WHEN knowledge_base IS NOT NULL AND trim(knowledge_base) != '' THEN true ELSE false END,
    'faq', CASE WHEN faq IS NOT NULL AND trim(faq) != '' THEN true ELSE false END,
    'advisor', false,
    'schedule', true
  )
WHERE advisor_enabled IS NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Nuevas funcionalidades del agente IA agregadas:';
  RAISE NOTICE '📋 Campo advisor_enabled: Agregado';
  RAISE NOTICE '💬 Campo advisor_message: Agregado';
  RAISE NOTICE '⏰ Campo always_active: Agregado';
  RAISE NOTICE '📅 Campo operating_hours: Agregado';
  RAISE NOTICE '📊 Campo training_progress: Agregado';
  RAISE NOTICE '🔧 Funciones: calculate_training_progress, is_agent_active_now, get_advisor_message';
  RAISE NOTICE '🎯 El frontend puede usar estas funciones para las nuevas funcionalidades';
END $$;
