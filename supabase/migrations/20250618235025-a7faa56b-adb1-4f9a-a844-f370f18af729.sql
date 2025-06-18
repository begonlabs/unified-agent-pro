
-- Insert admin role for the specified user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users 
WHERE email = 'ernestogrz91@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
