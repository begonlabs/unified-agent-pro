
-- Crear usuario administrador
-- Basado en: supabase/migrations/20250618235025-a7faa56b-adb1-4f9a-a844-f370f18af729.sql

-- Insert admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'ernestogrz91@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
