-- Migration to add robust general statistics function

CREATE OR REPLACE FUNCTION public.get_general_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_clients INTEGER;
  v_plan_counts JSONB;
  v_total_messages INTEGER;
  v_total_leads INTEGER;
  v_whatsapp_messages INTEGER;
  v_facebook_messages INTEGER;
  v_instagram_messages INTEGER;
  v_whatsapp_leads INTEGER;
  v_facebook_leads INTEGER;
  v_instagram_leads INTEGER;
  v_total_conversations INTEGER;
  v_active_clients INTEGER;
  v_inactive_clients INTEGER;
BEGIN
  -- 1. Client Stats (Profiles)
  SELECT COUNT(*) INTO v_total_clients FROM profiles;
  
  -- Count active/inactive
  SELECT COUNT(*) INTO v_active_clients FROM profiles WHERE is_active = true;
  SELECT COUNT(*) INTO v_inactive_clients FROM profiles WHERE is_active = false;

  -- Count by plan type (dynamic aggregation)
  SELECT jsonb_object_agg(plan, count) INTO v_plan_counts
  FROM (
    SELECT plan_type as plan, COUNT(*) as count
    FROM profiles
    GROUP BY plan_type
  ) t;

  -- 2. Message Stats
  -- This might be slow on huge tables, but for now it's better than N+1. 
  -- Ideally we should have a counter cache or estimate.
  SELECT COUNT(*) INTO v_total_messages FROM messages;

  -- Channel breakdown for messages (via conversations table join)
  SELECT 
    COUNT(*) FILTER (WHERE c.channel = 'whatsapp'),
    COUNT(*) FILTER (WHERE c.channel = 'facebook'),
    COUNT(*) FILTER (WHERE c.channel = 'instagram')
  INTO 
    v_whatsapp_messages,
    v_facebook_messages,
    v_instagram_messages
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id;

  -- 3. Lead Stats (CRM Clients)
  SELECT COUNT(*) INTO v_total_leads FROM crm_clients;

  -- Channel breakdown for leads
  SELECT 
    COUNT(*) FILTER (WHERE source = 'whatsapp'),
    COUNT(*) FILTER (WHERE source = 'facebook'),
    COUNT(*) FILTER (WHERE source = 'instagram')
  INTO 
    v_whatsapp_leads,
    v_facebook_leads,
    v_instagram_leads
  FROM crm_clients;

  -- 4. Conversation Stats
  SELECT COUNT(*) INTO v_total_conversations FROM conversations;

  -- Return JSON
  RETURN jsonb_build_object(
    'total_clients', v_total_clients,
    'active_clients', v_active_clients,
    'inactive_clients', v_inactive_clients,
    'plan_counts', COALESCE(v_plan_counts, '{}'::jsonb),
    'total_messages_platform', v_total_messages,
    'total_leads_platform', v_total_leads,
    'whatsapp_messages', v_whatsapp_messages,
    'facebook_messages', v_facebook_messages,
    'instagram_messages', v_instagram_messages,
    'whatsapp_leads', v_whatsapp_leads,
    'facebook_leads', v_facebook_leads,
    'instagram_leads', v_instagram_leads,
    'total_conversations', v_total_conversations
  );
END;
$$;
