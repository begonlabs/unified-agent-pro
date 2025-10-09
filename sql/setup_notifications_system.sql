-- ============================================
-- SISTEMA DE NOTIFICACIONES - OndAI
-- ============================================
-- Este script crea la tabla de notificaciones y sus políticas RLS
-- Incluye triggers automáticos y funciones auxiliares

-- 1. Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Información de la notificación
    type TEXT NOT NULL CHECK (type IN (
        'message',
        'ticket',
        'channel',
        'ai_response',
        'verification',
        'connection',
        'system',
        'warning',
        'error'
    )),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN (
        'low',
        'medium',
        'high',
        'urgent'
    )),
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN (
        'unread',
        'read',
        'archived'
    )),
    
    -- Contenido
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Acciones
    action_url TEXT,
    action_label TEXT,
    
    -- Fechas
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Índices para mejorar rendimiento
    CONSTRAINT valid_read_at CHECK (read_at IS NULL OR read_at >= created_at),
    CONSTRAINT valid_expires_at CHECK (expires_at IS NULL OR expires_at >= created_at)
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- 3. Crear políticas RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias notificaciones (marcar como leídas)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propias notificaciones
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Política: Sistema puede crear notificaciones para cualquier usuario
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- 4. Función para limpiar notificaciones expiradas automáticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

-- 5. Función para crear notificación automáticamente
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_priority TEXT DEFAULT 'medium',
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_action_url TEXT DEFAULT NULL,
    p_action_label TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        priority,
        metadata,
        action_url,
        action_label,
        expires_at
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_priority,
        p_metadata,
        p_action_url,
        p_action_label,
        p_expires_at
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 6. Trigger para actualizar read_at automáticamente
CREATE OR REPLACE FUNCTION public.update_notification_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'read' AND OLD.status != 'read' AND NEW.read_at IS NULL THEN
        NEW.read_at := now();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_notification_read_at ON public.notifications;
CREATE TRIGGER trg_update_notification_read_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_notification_read_at();

-- 7. Función auxiliar para obtener contador de notificaciones no leídas
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER
    INTO v_count
    FROM public.notifications
    WHERE user_id = p_user_id
    AND status = 'unread';
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 8. Habilitar Realtime para notificaciones (opcional pero recomendado)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 9. Comentarios para documentación
COMMENT ON TABLE public.notifications IS 'Tabla de notificaciones del sistema OndAI';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación: message, ticket, channel, etc.';
COMMENT ON COLUMN public.notifications.priority IS 'Prioridad: low, medium, high, urgent';
COMMENT ON COLUMN public.notifications.status IS 'Estado: unread, read, archived';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales en formato JSON';
COMMENT ON FUNCTION public.create_notification IS 'Función para crear notificaciones programáticamente';
COMMENT ON FUNCTION public.get_unread_notifications_count IS 'Obtiene el contador de notificaciones no leídas de un usuario';

-- 10. Crear algunas notificaciones de ejemplo (opcional - comentar en producción)
/*
-- Ejemplo de notificación de mensaje
SELECT public.create_notification(
    (SELECT id FROM auth.users LIMIT 1),
    'message',
    'Nuevo mensaje',
    'Tienes un nuevo mensaje de un cliente',
    'high',
    '{"conversation_id": "123", "client_name": "Juan Pérez"}'::jsonb,
    '/dashboard?view=messages',
    'Ver mensaje',
    now() + interval '7 days'
);

-- Ejemplo de notificación de sistema
SELECT public.create_notification(
    (SELECT id FROM auth.users LIMIT 1),
    'system',
    'Bienvenido a OndAI',
    'Gracias por usar nuestra plataforma',
    'medium',
    '{}'::jsonb,
    NULL,
    NULL,
    NULL
);
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

