// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Instagram OAuth Redirect Handler
// Handles Instagram Business API authentication
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

    // Get environment variables - Instagram uses same Meta app
    const appId = Deno.env.get('META_APP_ID') // Same as Facebook
    const appSecret = Deno.env.get('META_APP_SECRET') // Same as Facebook
    const redirectUri = Deno.env.get('INSTAGRAM_REDIRECT_URI') || 'https://supabase.ondai.ai/functions/v1/instagram-oauth'
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v23.0'
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

    console.log('🔄 Processing Instagram OAuth with code:', code.substring(0, 10) + '...')

    // Exchange code for access token (same process as Facebook)
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    )

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorText)
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Token exchange failed: HTTP ${tokenResponse.status}: ${errorText}`,
          debug: {
            redirect_uri: redirectUri,
            graph_version: graphVersion
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const userAccessToken = tokenData.access_token

    if (!userAccessToken) {
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

    console.log('✅ User access token obtained')

    // Get user's Facebook pages (Instagram Business accounts are connected to Facebook pages)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/me/accounts?access_token=${userAccessToken}`
    )

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text()
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: `Error fetching pages: HTTP ${pagesResponse.status}: ${errorText}`
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
          error: 'No Facebook pages found for this user. Instagram Business requires a Facebook page.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('📄 Found', pages.length, 'Facebook pages')

    // Get Instagram Business accounts connected to pages
    const pagesWithInstagram = []
    
    for (const page of pages) {
      try {
        // Check if page has Instagram Business account
        const igResponse = await fetch(
          `https://graph.facebook.com/${graphVersion}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
        )
        
        if (igResponse.ok) {
          const igData = await igResponse.json()
          if (igData.instagram_business_account?.id) {
            pagesWithInstagram.push({
              page_id: page.id,
              page_name: page.name,
              page_access_token: page.access_token,
              instagram_business_account_id: igData.instagram_business_account.id
            })
          }
        }
      } catch (error) {
        console.log('⚠️ Error checking Instagram for page:', page.name, error)
      }
    }

    if (pagesWithInstagram.length === 0) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No Instagram Business accounts found connected to your Facebook pages. Please connect an Instagram Business account to a Facebook page first.',
          debug: { 
            pages_found: pages.length,
            pages_names: pages.map(p => p.name)
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the first Instagram Business account found
    const selectedIG = pagesWithInstagram[0]
    
    console.log('📸 Selected Instagram Business account:', {
      page_name: selectedIG.page_name,
      instagram_id: selectedIG.instagram_business_account_id
    })

    // Subscribe the Instagram account to webhooks
    let webhookSubscribed = false
    try {
      const webhookResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${selectedIG.instagram_business_account_id}/subscribed_apps?access_token=${selectedIG.page_access_token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (webhookResponse.ok) {
        webhookSubscribed = true
        console.log('✅ Instagram webhook subscription successful')
      } else {
        const errorText = await webhookResponse.text()
        console.error('⚠️ Instagram webhook subscription failed:', errorText)
        // Continue anyway
      }
    } catch (webhookError) {
      console.error('⚠️ Instagram webhook subscription error:', webhookError)
      // Continue anyway
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract user ID from the state parameter
    let userId: string | null = null
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state))
        userId = stateData.user_id
      } catch (error) {
        console.error('Error parsing state parameter:', error)
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'User ID not found in state parameter',
          debug: { state }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if Instagram channel already exists for this user
    const { data: existingChannel, error: checkError } = await supabase
      .from('communication_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'instagram')
      .maybeSingle()

    let dbError
    if (existingChannel) {
      // Update existing channel
      console.log('🔄 Updating existing Instagram channel for user:', userId)
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({
          channel_config: {
            page_id: selectedIG.page_id,
            page_name: selectedIG.page_name,
            page_access_token: selectedIG.page_access_token,
            instagram_business_account_id: selectedIG.instagram_business_account_id,
            user_access_token: userAccessToken,
            webhook_subscribed: webhookSubscribed,
            connected_at: new Date().toISOString()
          },
          is_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingChannel.id)
      dbError = updateError
    } else {
      // Create new channel
      console.log('➕ Creating new Instagram channel for user:', userId)
      const { error: insertError } = await supabase
        .from('communication_channels')
        .insert({
          user_id: userId,
          channel_type: 'instagram',
          channel_config: {
            page_id: selectedIG.page_id,
            page_name: selectedIG.page_name,
            page_access_token: selectedIG.page_access_token,
            instagram_business_account_id: selectedIG.instagram_business_account_id,
            user_access_token: userAccessToken,
            webhook_subscribed: webhookSubscribed,
            connected_at: new Date().toISOString()
          },
          is_connected: true
        })
      dbError = insertError
    }

    if (dbError) {
      console.error('❌ Database operation error:', dbError)
      // Continue anyway, as the Instagram connection worked
    }

    // Redirect to frontend dashboard with success
    const frontendCallbackUrl = `https://ondai.ai/dashboard?success=true&page_name=${encodeURIComponent(selectedIG.page_name)}&instagram_id=${selectedIG.instagram_business_account_id}&channel=instagram&view=channels`
    
    return new Response(
      `<!DOCTYPE html>
<html>
<head>
    <title>Instagram Conectado</title>
    <meta http-equiv="refresh" content="0;url=${frontendCallbackUrl}">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%);
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
        <h1>📸 Instagram Conectado Exitosamente</h1>
        <p>Página: <strong>${selectedIG.page_name}</strong></p>
        <p>Instagram Business ID: <strong>${selectedIG.instagram_business_account_id}</strong></p>
        <p>Redirigiendo al dashboard...</p>
        <div class="spinner"></div>
        <p><small>Si no eres redirigido automáticamente, <a href="${frontendCallbackUrl}" style="color: #fff; text-decoration: underline;">haz clic aquí</a></small></p>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = "${frontendCallbackUrl}";
        }, 3000);
    </script>
</body>
</html>`,
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in instagram-oauth function:', error)
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