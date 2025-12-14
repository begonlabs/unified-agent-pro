// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Start Instagram Authentication
// Generates the Instagram OAuth authorization URL for users
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StartInstagramAuthRequest {
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const body: StartInstagramAuthRequest = await req.json()
    const { user_id } = body

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get environment variables - Prioritize Main App ID (OndAI) as Basic Display is likely part of it
    const igAppId = Deno.env.get('META_APP_ID') || Deno.env.get('VITE_META_APP_ID') || Deno.env.get('INSTAGRAM_BASIC_APP_ID') || Deno.env.get('VITE_INSTAGRAM_BASIC_APP_ID') || Deno.env.get('META_APP_IG_ID')
    const redirectUri = Deno.env.get('INSTAGRAM_REDIRECT_URI') || Deno.env.get('VITE_INSTAGRAM_REDIRECT_URI') || 'https://supabase.ondai.ai/functions/v1/instagram-oauth'

    console.log(`[Debug] Using Instagram App ID: ${igAppId} (Redirect: ${redirectUri})`)

    if (!igAppId) {
      return new Response(
        JSON.stringify({ error: 'Instagram App ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create state parameter with user information
    const state = encodeURIComponent(JSON.stringify({
      user_id,
      timestamp: Date.now(),
      source: 'dashboard'
    }))

    // Instagram scopes for Basic Display API + Messaging
    // Note: For Instagram DM access, you need Instagram Messaging API which requires business verification
    const scopes = [
      'user_profile',    // Basic profile information
      'user_media'       // User's media (required for Basic Display)
      // Note: Instagram Messaging requires additional app review and business verification
    ].join(',')

    // Build Instagram OAuth authorization URL
    const authUrl = new URL('https://api.instagram.com/oauth/authorize')
    authUrl.searchParams.set('client_id', igAppId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    console.log('🔗 Generated Instagram auth URL for user:', user_id)
    console.log('📋 Scopes requested:', scopes)
    console.log('🔄 Redirect URI:', redirectUri)

    return new Response(
      JSON.stringify({
        success: true,
        auth_url: authUrl.toString(),
        app_id: igAppId,
        scopes: scopes.split(','),
        redirect_uri: redirectUri,
        state_info: {
          user_id,
          timestamp: Date.now()
        },
        instructions: {
          next_steps: [
            'User will be redirected to Instagram for authorization',
            'User must log in with Instagram account',
            'User must authorize your app',
            'Instagram will redirect back to your callback URL',
            'Access token will be exchanged and stored'
          ],
          requirements: [
            'User must have Instagram account',
            'App must be approved for Instagram Basic Display',
            'For messaging: App must be approved for Instagram Messaging API'
          ]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in start-instagram-auth function:', error)
    return new Response(
      JSON.stringify({
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
