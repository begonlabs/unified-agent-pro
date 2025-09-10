
// configure-instagram-webhook/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Configure Instagram Webhook Subscription
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConfigureWebhookRequest {
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

    const body: ConfigureWebhookRequest = await req.json()
    const { user_id } = body

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Instagram channel for this user
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('channel_type', 'instagram')
      .eq('is_connected', true)
      .single()

    if (channelError || !channel) {
      return new Response(
        JSON.stringify({ error: 'Instagram channel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { access_token, instagram_user_id } = channel.channel_config

    if (!access_token || !instagram_user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing Instagram access token or user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔗 Configuring Instagram webhook for user:', instagram_user_id)

    // Subscribe to Instagram webhooks
    // For Instagram Messaging API, we need to subscribe to messaging events
    const webhookResponse = await fetch(
      `https://graph.facebook.com/v23.0/${instagram_user_id}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: access_token,
          subscribed_fields: [
            'messages',
            'messaging_postbacks',
            'messaging_optins',
            'messaging_reactions',
            'message_deliveries',
            'message_reads'
          ]
        })
      }
    )

    let webhookResult = null
    let webhookError = null

    if (webhookResponse.ok) {
      webhookResult = await webhookResponse.json()
      console.log('✅ Instagram webhook configured successfully:', webhookResult)
    } else {
      const errorText = await webhookResponse.text()
      webhookError = errorText
      console.error('❌ Instagram webhook configuration failed:', errorText)
    }

    // Update channel configuration with webhook status
    const { error: updateError } = await supabase
      .from('communication_channels')
      .update({
        channel_config: {
          ...channel.channel_config,
          webhook_subscribed: !!webhookResult,
          webhook_configured_at: new Date().toISOString(),
          webhook_error: webhookError
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', channel.id)

    if (updateError) {
      console.error('Error updating channel configuration:', updateError)
    }

    // Also try to configure the app-level webhook subscription
    // This requires the app access token, which we might not have directly
    const appId = Deno.env.get('META_APP_ID')
    const appSecret = Deno.env.get('META_APP_SECRET')

    if (appId && appSecret) {
      try {
        console.log('🔗 Configuring app-level Instagram webhook subscription...')
        
        const appWebhookResponse = await fetch(
          `https://graph.facebook.com/v23.0/${appId}/subscriptions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              object: 'instagram',
              callback_url: 'https://supabase.ondai.ai/functions/v1/meta-webhook',
              fields: 'messages,messaging_postbacks,messaging_optins,messaging_reactions',
              verify_token: Deno.env.get('META_VERIFY_TOKEN'),
              access_token: `${appId}|${appSecret}` // App access token
            })
          }
        )

        if (appWebhookResponse.ok) {
          const appWebhookResult = await appWebhookResponse.json()
          console.log('✅ App-level Instagram webhook configured:', appWebhookResult)
        } else {
          const appErrorText = await appWebhookResponse.text()
          console.log('⚠️ App-level webhook config info:', appErrorText)
        }
      } catch (appError) {
        console.log('⚠️ Could not configure app-level webhook:', appError.message)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        webhook_configured: !!webhookResult,
        webhook_result: webhookResult,
        webhook_error: webhookError,
        instagram_user_id,
        channel_id: channel.id,
        subscribed_fields: [
          'messages',
          'messaging_postbacks', 
          'messaging_optins',
          'messaging_reactions',
          'message_deliveries',
          'message_reads'
        ],
        webhook_url: 'https://supabase.ondai.ai/functions/v1/meta-webhook',
        instructions: {
          next_steps: [
            'Webhook subscription configured',
            'Test by sending a message to the Instagram account',
            'Check webhook logs for incoming messages',
            'Verify message storage in database'
          ],
          troubleshooting: [
            'Ensure Instagram account has messaging permissions',
            'Verify app has necessary Instagram permissions',
            'Check if business account is properly verified'
          ]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in configure-instagram-webhook function:', error)
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
