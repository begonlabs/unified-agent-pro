-- Add first_name, last_name, and country fields to profiles table

-- 1. Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
        ALTER TABLE public.profiles ADD COLUMN country TEXT;
    END IF;

    -- Add phone_country_code if it doesn't exist (saw it in code but maybe missing in DB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_country_code') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_country_code TEXT;
    END IF;
END $$;

-- 2. Update handle_new_user function to populate these fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insertar perfil automáticamente
  INSERT INTO public.profiles (
    user_id,
    company_name,
    email,
    first_name,
    last_name,
    country,
    phone_country_code,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Mi Empresa'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'country',
    NEW.raw_user_meta_data ->> 'phone_country_code',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insertar rol por defecto (cliente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  RETURN NEW;
END;
$$;
