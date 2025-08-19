// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Send Message to Facebook Messenger
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  conversation_id: string;
  message: string;
  user_id: string;
  test_mode?: boolean;
  page_id?: string;
}

interface Conversation {
  id: string;
  channel: string;
  channel_thread_id: string;
  client_id: string;
  user_id: string;
}

interface CommunicationChannel {
  id: string;
  channel_config: {
    page_id: string;
    page_access_token: string;
  };
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

    const body: SendMessageRequest = await req.json()
    const { conversation_id, message, user_id, test_mode, page_id } = body

    if (!conversation_id || !message || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle test mode
    if (test_mode) {
      console.log('🧪 Test mode activated');
      
      // Get Facebook channel for this user
      const { data: channels, error: channelError } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('user_id', user_id)
        .eq('channel_type', 'facebook')
        .eq('is_connected', true)
        .single()

      if (channelError || !channels) {
        return new Response(
          JSON.stringify({ 
            error: 'Facebook channel not found',
            test_mode: true,
            status: 'channel_not_found'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const channel = channels
      const pageAccessToken = channel.channel_config.page_access_token

      // Test message to page's own inbox (for testing purposes)
      const testRecipientId = page_id || channel.channel_config.page_id

      // Send test message to Facebook Messenger
      const messengerResponse = await fetch(
        `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: { id: testRecipientId },
            message: { text: message },
            messaging_type: 'RESPONSE'
          })
        }
      )

      if (!messengerResponse.ok) {
        const errorData = await messengerResponse.text()
        console.error('Facebook API error in test mode:', errorData)
        
        return new Response(
          JSON.stringify({ 
            error: 'Facebook API error',
            details: errorData,
            test_mode: true,
            status: 'facebook_api_error'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const result = await messengerResponse.json()
      
      return new Response(
        JSON.stringify({ 
          success: true,
          test_mode: true,
          facebook_response: result,
          message_sent: message,
          recipient_id: testRecipientId,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .eq('user_id', user_id)
      .single()

    if (convError || !conversation) {
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Facebook channel for this user
    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('channel_type', 'facebook')
      .eq('is_connected', true)
      .single()

    if (channelError || !channels) {
      return new Response(
        JSON.stringify({ error: 'Facebook channel not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const channel = channels
    const pageAccessToken = channel.channel_config.page_access_token
    const recipientId = conversation.channel_thread_id

    // Send message to Facebook Messenger
    const messengerResponse = await fetch(
      `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'RESPONSE'
        })
      }
    )

    if (!messengerResponse.ok) {
      const errorData = await messengerResponse.text()
      console.error('Facebook API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send message to Facebook' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messengerResult = await messengerResponse.json()
    console.log('Facebook API response:', messengerResult)

    // Save message to database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        content: message,
        sender_type: 'human',
        is_automated: false,
        sender_name: 'Usuario'
      })

    if (messageError) {
      console.error('Error saving message to database:', messageError)
      return new Response(
        JSON.stringify({ error: 'Message sent but failed to save locally' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open'
      })
      .eq('id', conversation_id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messengerResult.message_id,
        conversation_id: conversation_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-message function:', error)
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
