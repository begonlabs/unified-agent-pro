-- Migration to set up the DB Webhook for New Registrations Triggering the Admin Notification Edge Function
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create or replace the webhook trigger function
CREATE OR REPLACE FUNCTION public.trigger_admin_signup_notification()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://supabase.ondai.ai/functions/v1/notify-admin-signup';
  request_body jsonb;
  request_headers jsonb := '{"Content-Type": "application/json"}'::jsonb;
BEGIN
  -- Construct the payload representing the new profile
  request_body := row_to_json(NEW)::jsonb;

  -- Fire the asynchronous HTTP POST request using pg_net extension
  -- Using timeout_milliseconds 1000 since edge function will handle it async
  PERFORM net.http_post(
      url := webhook_url,
      body := request_body,
      headers := request_headers,
      timeout_milliseconds := 2000
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If pg_net fails (e.g., ext not loaded natively), fallback graceful return to not block signups
    RAISE LOG 'Error firing webhook for notify-admin-signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow safe reruns
DROP TRIGGER IF EXISTS on_profile_created_notify_admins ON public.profiles;

-- Create the trigger executing AFTER an INSERT exclusively on new accounts
CREATE TRIGGER on_profile_created_notify_admins
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_admin_signup_notification();
