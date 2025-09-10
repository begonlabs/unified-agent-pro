// meta-oauth/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Meta (Facebook) OAuth Redirect Handler
// Exchanges code -> user_access_token, fetches pages and page_access_tokens.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing authorization code',
          debug: { request_url: req.url }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const appId = Deno.env.get('META_APP_ID')
    const appSecret = Deno.env.get('META_APP_SECRET')
    const redirectUri = Deno.env.get('META_REDIRECT_URI') || 'https://supabase.ondai.ai/functions/v1/meta-oauth'
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v23.0'
    const verifyToken = Deno.env.get('META_VERIFY_TOKEN')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!appId || !appSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required environment variables',
          debug: { 
            app_id_present: !!appId,
            app_secret_present: !!appSecret,
            supabase_url_present: !!supabaseUrl,
            service_key_present: !!supabaseServiceKey
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${redirectUri}&` +
      `code=${code}`
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Error: HTTP ${tokenResponse.status}: ${errorText}`,
          debug: {
            request_url: req.url,
            computed_redirect_uri: redirectUri,
            graph_version: graphVersion,
            app_id_present: !!appId
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No access token received',
          debug: { token_response: tokenData }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/me/accounts?access_token=${accessToken}`
    )

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Error fetching pages: HTTP ${pagesResponse.status}: ${errorText}`,
          debug: { access_token_present: !!accessToken }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []

    if (pages.length === 0) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No Facebook pages found for this user',
          debug: { user_id: 'extracted_from_token' }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For now, we'll work with the first page
    // In a real implementation, you might want to let the user choose
    const selectedPage = pages[0]
    const pageId = selectedPage.id
    const pageName = selectedPage.name
    const pageAccessToken = selectedPage.access_token

    // Subscribe the page to webhooks with proper format
    let webhookSubscribed = false;
    try {
      const webhookResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${pageId}/subscribed_apps?` +
        `access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins', 'message_deliveries', 'message_reads', 'message_echoes']
          })
        }
      )

      if (webhookResponse.ok) {
        webhookSubscribed = true;
        console.log('Webhook subscription successful for page:', pageId);
      } else {
        const errorText = await webhookResponse.text();
        console.error('Webhook subscription failed:', errorText);
        // Continue anyway, as the page connection is still valid
      }
    } catch (webhookError) {
      console.error('Webhook subscription error:', webhookError);
      // Continue anyway
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract user ID from the state parameter
    let userId: string | null = null;
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state));
        userId = stateData.user_id;
      } catch (error) {
        console.error('Error parsing state parameter:', error);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'User ID not found in state parameter',
          debug: { state, parsed_state: state ? JSON.parse(decodeURIComponent(state)) : null }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if channel already exists for this user
    const { data: existingChannel, error: checkError } = await supabase
      .from('communication_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'facebook')
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing channel:', checkError);
      // Continue anyway, as the Facebook connection worked
    }

    let dbError;
    if (existingChannel) {
      // Update existing channel
      console.log('Updating existing Facebook channel for user:', userId);
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({
          channel_config: {
            page_id: pageId,
            page_name: pageName,
            page_access_token: pageAccessToken,
            user_access_token: accessToken,
            webhook_subscribed: webhookSubscribed,
            connected_at: new Date().toISOString()
          },
          is_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingChannel.id);
      dbError = updateError;
    } else {
      // Create new channel
      console.log('Creating new Facebook channel for user:', userId);
      const { error: insertError } = await supabase
        .from('communication_channels')
        .insert({
          user_id: userId,
          channel_type: 'facebook',
          channel_config: {
            page_id: pageId,
            page_name: pageName,
            page_access_token: pageAccessToken,
            user_access_token: accessToken,
            webhook_subscribed: webhookSubscribed,
            connected_at: new Date().toISOString()
          },
          is_connected: true
        });
      dbError = insertError;
    }

    if (dbError) {
      console.error('Database operation error:', dbError)
      // Return success anyway, as the Facebook connection worked
    }

    // Redirect to frontend dashboard with success
    const frontendCallbackUrl = `https://ondai.ai/dashboard?success=true&page_id=${pageId}&page_name=${encodeURIComponent(pageName)}&channel=facebook&view=channels`;
    
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
    <title>Redirigiendo...</title>
    <meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { 
            max-width: 500px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
        }
        .spinner { 
            border: 3px solid rgba(255,255,255,0.3); 
            border-top: 3px solid white; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 20px auto;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Facebook Conectado Exitosamente</h1>
        <p>Página: <strong>${pageName}</strong></p>
        <p>Redirigiendo al dashboard...</p>
        <div class="spinner"></div>
        <p><small>Si no eres redirigido automáticamente, <a href="${frontendCallbackUrl}" style="color: #fff; text-decoration: underline;">haz clic aquí</a></small></p>
    </div>
    <script>
        // Redirect after a short delay to ensure the page loads
        setTimeout(() => {
            window.location.href = "${frontendCallbackUrl}";
        }, 2000);
    </script>
</body>
</html>`,
      { 
      status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )

  } catch (error) {
    console.error('Error in meta-oauth function:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: `Internal server error: ${error.message}`,
        debug: { request_url: req.url }
      }),
      { 
      status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})