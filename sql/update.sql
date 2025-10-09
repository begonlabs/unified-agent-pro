-- =====================================================
-- ACTUALIZACIÓN PARA OPCIÓN 2: Platform Message ID y Metadata
-- =====================================================

-- 1. Agregar campos necesarios a la tabla messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS platform_message_id TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Agregar campo source a crm_clients (para tracking de origen)
ALTER TABLE public.crm_clients 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- 3. Actualizar comentario de sender_type para reflejar la Opción 2
COMMENT ON COLUMN public.messages.sender_type IS 'client | agent | ia - Opción 2 implementada';

-- 4. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_platform_message_id ON public.messages(platform_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_type ON public.messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_metadata ON public.messages USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_crm_clients_source ON public.crm_clients(source);

-- 5. Comentarios descriptivos para los nuevos campos
COMMENT ON COLUMN public.messages.platform_message_id IS 'ID del mensaje en la plataforma externa (Facebook/Instagram message_id)';
COMMENT ON COLUMN public.messages.metadata IS 'Información adicional del mensaje (plataforma, timestamps, datos de IA, etc.)';
COMMENT ON COLUMN public.crm_clients.source IS 'Origen del cliente: facebook | instagram | whatsapp | manual';

-- =====================================================
-- VERIFICACIÓN DE LA ESTRUCTURA (OPCIONAL)
-- =====================================================

-- Para verificar que los campos se agregaron correctamente:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'messages' AND table_schema = 'public'
-- ORDER BY ordinal_position;