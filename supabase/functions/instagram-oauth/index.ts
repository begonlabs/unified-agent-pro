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

    // Get environment variables - Use Instagram Basic Display credentials
    const appId = Deno.env.get('META_APP_IG_ID') || Deno.env.get('INSTAGRAM_BASIC_APP_ID') // Instagram App ID
    const appSecret = Deno.env.get('META_APP_IG_SECRET') || Deno.env.get('INSTAGRAM_BASIC_APP_SECRET') // Instagram App Secret
    const redirectUri = Deno.env.get('INSTAGRAM_REDIRECT_URI') || 'https://supabase.ondai.ai/functions/v1/instagram-oauth'
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v23.0'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Enhanced environment variable debugging
    console.log('🔍 Environment variables check:')
    console.log('  META_APP_IG_ID:', Deno.env.get('META_APP_IG_ID') ? '✅ Present' : '❌ Missing')
    console.log('  INSTAGRAM_BASIC_APP_ID:', Deno.env.get('INSTAGRAM_BASIC_APP_ID') ? '✅ Present' : '❌ Missing') 
    console.log('  META_APP_IG_SECRET:', Deno.env.get('META_APP_IG_SECRET') ? '✅ Present' : '❌ Missing')
    console.log('  INSTAGRAM_BASIC_APP_SECRET:', Deno.env.get('INSTAGRAM_BASIC_APP_SECRET') ? '✅ Present' : '❌ Missing')
    console.log('  Final appId used:', appId || 'UNDEFINED')
    console.log('  Final appSecret used:', appSecret ? 'SET' : 'UNDEFINED')

    if (!appId || !appSecret || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required environment variables',
          debug: {
            app_id_present: !!appId,
            app_secret_present: !!appSecret,
            supabase_url_present: !!supabaseUrl,
            service_key_present: !!supabaseServiceKey,
            env_check: {
              META_APP_IG_ID: !!Deno.env.get('META_APP_IG_ID'),
              INSTAGRAM_BASIC_APP_ID: !!Deno.env.get('INSTAGRAM_BASIC_APP_ID'),

              META_APP_IG_SECRET: !!Deno.env.get('META_APP_IG_SECRET'),
              INSTAGRAM_BASIC_APP_SECRET: !!Deno.env.get('INSTAGRAM_BASIC_APP_SECRET')
            }
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 Processing Instagram OAuth with code:', code.substring(0, 10) + '...')
    console.log('📍 Using redirect URI:', redirectUri)
    console.log('🆔 Using App ID:', appId)

    // Exchange code for access token using Instagram Basic Display API
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      })
    })

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
    const shortLivedToken = tokenData.access_token
    const igUserId = tokenData.user_id

    if (!shortLivedToken || !igUserId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'No access token or user ID received from Instagram',
          debug: { token_response: tokenData }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Short-lived Instagram token obtained for user:', igUserId)

    // Exchange short-lived token for long-lived token (60 days)
    console.log('🔄 Exchanging for long-lived token...')
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
      `grant_type=ig_exchange_token&` +
      `client_secret=${appSecret}&` +
      `access_token=${shortLivedToken}`
    )

    let finalToken = shortLivedToken
    let tokenType = 'short_lived'
    let expiresIn = 3600 // 1 hour for short-lived

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json()
      if (longLivedData.access_token) {
        finalToken = longLivedData.access_token
        tokenType = 'long_lived'
        expiresIn = longLivedData.expires_in || 5184000 // 60 days
        console.log('✅ Long-lived token obtained')
      }
    } else {
      console.log('⚠️ Using short-lived token instead')
    }

    // Get user profile information using Instagram Basic Display API
    console.log('👤 Fetching Instagram user profile...')
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,media_count,account_type&access_token=${finalToken}`
    )

    let userProfile = { id: igUserId, username: `ig_user_${igUserId}`, account_type: 'PERSONAL' }
    if (profileResponse.ok) {
      userProfile = await profileResponse.json()
      console.log('✅ User profile obtained:', userProfile.username)
    } else {
      console.log('⚠️ Could not fetch user profile, using defaults')
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

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString()

    let dbError
    if (existingChannel) {
      // Update existing channel
      console.log('🔄 Updating existing Instagram channel for user:', userId)
      const { error: updateError } = await supabase
        .from('communication_channels')
        .update({
          channel_config: {
            instagram_user_id: userProfile.id,
            username: userProfile.username,
            account_type: userProfile.account_type,
            access_token: finalToken,
            token_type: tokenType,
            expires_at: expiresAt,
            media_count: userProfile.media_count || 0,
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
            instagram_user_id: userProfile.id,
            username: userProfile.username,
            account_type: userProfile.account_type,
            access_token: finalToken,
            token_type: tokenType,
            expires_at: expiresAt,
            media_count: userProfile.media_count || 0,
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
    const frontendCallbackUrl = `https://ondai.ai/dashboard?success=true&instagram_user=${encodeURIComponent(userProfile.username)}&account_type=${userProfile.account_type}&channel=instagram&view=channels`
    
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
        <p>Usuario: <strong>@${userProfile.username}</strong></p>
        <p>Tipo: <strong>${userProfile.account_type}</strong></p>
        <p>Token: <strong>${tokenType}</strong></p>
        <p>Redirigiendo al dashboard...</p>
        <div class="spinner"></div>
        <p><small>Si no eres redirigido automáticamente, <a href="${frontendCallbackUrl}" style="color: #fff; text-decoration: underline;">haz clic aquí</a></small></p>
    </div>
    <script>
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