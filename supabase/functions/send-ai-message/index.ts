// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Send AI Message to Facebook Messenger
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendAIMessageRequest {
  conversation_id: string;
  message: string;
  user_id: string;
  ai_model?: string;
  ai_prompt?: string;
  confidence_score?: number;
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

    const body: SendAIMessageRequest = await req.json()
    const { 
      conversation_id, 
      message, 
      user_id, 
      ai_model = 'default', 
      ai_prompt, 
      confidence_score 
    } = body

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

    console.log('🤖 Processing AI message request:', {
      conversation_id,
      user_id,
      ai_model,
      message_length: message.length
    })

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

    // Get communication channel for this user
    let channelType = 'facebook'; // Default to facebook
    if (conversation.channel === 'instagram') {
      channelType = 'instagram';
    }

    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('channel_type', channelType)
      .eq('is_connected', true)
      .single()

    if (channelError || !channels) {
      return new Response(
        JSON.stringify({ error: `${channelType} channel not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const channel = channels
    const pageAccessToken = channel.channel_config.page_access_token
    const recipientId = conversation.channel_thread_id

    console.log('📤 Sending AI message via', channelType, 'to:', recipientId)

    // Send message to Facebook/Instagram API
    const apiUrl = channelType === 'instagram' 
      ? `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`
      : `https://graph.facebook.com/v23.0/me/messages?access_token=${pageAccessToken}`;

    const messengerResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE'
      })
    })

    if (!messengerResponse.ok) {
      const errorData = await messengerResponse.text()
      console.error('Platform API error:', errorData)
      return new Response(
        JSON.stringify({ error: `Failed to send message to ${channelType}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messengerResult = await messengerResponse.json()

    // Save AI message to database with new structure (Option 2)
    const messageData = {
      conversation_id: conversation_id,
      content: message,
      sender_type: 'ia', // AI messages
      is_automated: true, // AI is always automated
      sender_name: 'IA Assistant',
      platform_message_id: messengerResult.message_id, // Platform message ID
      metadata: {
        platform: channelType,
        ai_model,
        ai_prompt,
        confidence_score,
        facebook_message_id: messengerResult.message_id,
        timestamp: new Date().toISOString(),
        automated_response: true
      }
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert(messageData)

    if (messageError) {
      console.error('Error saving AI message to database:', messageError)
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

    console.log('✅ AI message sent and saved successfully:', {
      conversation_id,
      sender_type: 'ia',
      platform_message_id: messengerResult.message_id,
      ai_model
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messengerResult.message_id,
        conversation_id: conversation_id,
        sender_type: 'ia',
        ai_model,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-ai-message function:', error)
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
