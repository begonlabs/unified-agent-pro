-- Agregar funcionalidad de IA por conversación
-- Este script agrega el campo ai_enabled a la tabla conversations

-- 1. Agregar columna ai_enabled a conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false;

-- 2. Agregar comentario para documentar la funcionalidad
COMMENT ON COLUMN public.conversations.ai_enabled IS 'Indica si la IA está habilitada para responder automáticamente en esta conversación';

-- 3. Crear índice para optimizar consultas de conversaciones con IA habilitada
CREATE INDEX IF NOT EXISTS idx_conversations_ai_enabled ON public.conversations(ai_enabled) WHERE ai_enabled = true;

-- 4. Actualizar RLS policy para incluir el nuevo campo (si existe)
-- Verificar que los usuarios solo puedan ver/editar sus propias conversaciones
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON public.conversations;
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Función para obtener configuración de IA de una conversación
CREATE OR REPLACE FUNCTION public.get_conversation_ai_config(_conversation_id UUID)
RETURNS TABLE (
    ai_enabled BOOLEAN,
    user_id UUID,
    ai_goals TEXT,
    ai_restrictions TEXT,
    ai_knowledge_base TEXT,
    ai_faq TEXT,
    response_time INTEGER
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT 
        c.ai_enabled,
        c.user_id,
        ac.goals,
        ac.restrictions,
        ac.knowledge_base,
        ac.faq,
        ac.response_time
    FROM public.conversations c
    LEFT JOIN public.ai_configurations ac ON c.user_id = ac.user_id
    WHERE c.id = _conversation_id;
$$;

-- 6. Función para habilitar/deshabilitar IA en una conversación
CREATE OR REPLACE FUNCTION public.toggle_conversation_ai(_conversation_id UUID, _ai_enabled BOOLEAN)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
    _user_id UUID := auth.uid();
    _updated_rows INTEGER;
BEGIN
    -- Verificar que el usuario sea el propietario de la conversación
    UPDATE public.conversations 
    SET ai_enabled = _ai_enabled,
        updated_at = NOW()
    WHERE id = _conversation_id 
      AND user_id = _user_id;
    
    GET DIAGNOSTICS _updated_rows = ROW_COUNT;
    
    RETURN _updated_rows > 0;
END;
$$;

-- 7. Crear vista para estadísticas de IA
CREATE OR REPLACE VIEW public.ai_conversation_stats AS
SELECT 
    c.user_id,
    COUNT(*) as total_conversations,
    COUNT(*) FILTER (WHERE c.ai_enabled = true) as ai_enabled_conversations,
    COUNT(*) FILTER (WHERE c.ai_enabled = false) as manual_conversations,
    ROUND(
        (COUNT(*) FILTER (WHERE c.ai_enabled = true) * 100.0) / NULLIF(COUNT(*), 0),
        2
    ) as ai_adoption_percentage
FROM public.conversations c
GROUP BY c.user_id;

-- 8. Comentarios para documentación
COMMENT ON FUNCTION public.get_conversation_ai_config IS 'Obtiene la configuración de IA para una conversación específica';
COMMENT ON FUNCTION public.toggle_conversation_ai IS 'Habilita o deshabilita la IA para una conversación específica';
COMMENT ON VIEW public.ai_conversation_stats IS 'Estadísticas de adopción de IA por usuario';

-- 9. Realtime ya está habilitado para conversations
-- La tabla conversations ya está en la publicación supabase_realtime
