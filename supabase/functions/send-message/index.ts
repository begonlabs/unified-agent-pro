// send-message/index.ts
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
  sender_type?: 'agent' | 'ia' | 'client'; // Option 2: agent or ia messages
  sender_name?: string;
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
    const { conversation_id, message, user_id, sender_type = 'agent', sender_name } = body

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

    // Check message limits
    // Check message limits ONLY for IA messages
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('messages_sent_this_month, messages_limit, is_trial, payment_status')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    } else if (profile && sender_type === 'ia') {
      // Check limits only if sender is IA
      if (!profile.is_trial && profile.payment_status === 'active') {
        const sent = profile.messages_sent_this_month || 0;
        const limit = profile.messages_limit || 0;

        if (sent >= limit) {
          return new Response(
            JSON.stringify({
              error: 'Message limit reached',
              details: `You have sent ${sent} of ${limit} messages this month.`
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else if (!profile.is_trial && profile.payment_status !== 'active') {
        return new Response(
          JSON.stringify({
            error: 'Subscription inactive',
            details: 'Your subscription is not active.'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine channel type from conversation
    const channelType = conversation.channel || 'facebook';

    // Map 'whatsapp' to 'whatsapp_green_api' for channel lookup
    const channelTypeLookup = channelType === 'whatsapp' ? 'whatsapp_green_api' : channelType;

    // Get channel for this user based on conversation channel
    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('channel_type', channelTypeLookup)
      .eq('is_connected', true)
      .single()

    if (channelError || !channels) {
      return new Response(
        JSON.stringify({ error: `${channelType} channel not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const channel = channels

    // Handle WhatsApp (Green API)
    if (channelType === 'whatsapp') {
      const recipientId = conversation.channel_thread_id;
      const idInstance = channel.channel_config.idInstance;
      const apiToken = channel.channel_config.apiTokenInstance;

      console.log('📤 Sending WhatsApp message via Green API to:', recipientId);

      const apiUrl = `https://7107.api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;

      const whatsappResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: recipientId,
          message: message
        })
      });

      if (!whatsappResponse.ok) {
        const errorData = await whatsappResponse.text();
        console.error('WhatsApp API error:', errorData);
        return new Response(
          JSON.stringify({ error: 'Failed to send message to WhatsApp' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const whatsappResult = await whatsappResponse.json();
      const messageId = whatsappResult.idMessage;

      // Save message to database
      const messageData = {
        conversation_id: conversation_id,
        content: message,
        sender_type: sender_type,
        is_automated: sender_type === 'ia',
        sender_name: sender_name || (sender_type === 'ia' ? 'IA Assistant' : sender_type === 'agent' ? 'Agente' : 'Cliente'),
        platform_message_id: messageId,
        metadata: {
          platform: 'whatsapp',
          platform_message_id: messageId,
          timestamp: new Date().toISOString(),
          sent_via: 'send-message-function'
        }
      };

      const { error: messageError } = await supabase
        .from('messages')
        .insert(messageData);

      if (messageError) {
        console.error('Error saving message to database:', messageError);
        return new Response(
          JSON.stringify({ error: 'Message sent but failed to save locally' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'open'
        })
        .eq('id', conversation_id);

      return new Response(
        JSON.stringify({
          success: true,
          message_id: messageId,
          conversation_id: conversation_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use correct access token and API endpoint based on channel type (Facebook/Instagram)
    const accessToken = channelType === 'instagram'
      ? channel.channel_config.access_token
      : channel.channel_config.page_access_token;

    const recipientId = conversation.channel_thread_id

    console.log('📤 Sending message via', channelType, 'to:', recipientId);
    console.log('🔑 Access token present:', !!accessToken);

    // Send message to Facebook/Instagram API
    // IMPORTANT: For Instagram Graph API (Business), we use graph.facebook.com
    // AND we need the Instagram Business Account ID, not 'me'
    let apiUrl = `https://graph.facebook.com/v21.0/me/messages`; // Default for Facebook (v21.0 stable)

    if (channelType === 'instagram') {
      let igBusinessId = channel.channel_config.instagram_business_account_id;

      // Fallback: If ID is missing, try to fetch it using the Page Token
      if (!igBusinessId && accessToken) {
        console.log('⚠️ IG Business ID missing in config, attempting to fetch from API...');
        try {
          const accountResp = await fetch(
            `https://graph.facebook.com/v21.0/me?fields=instagram_business_account&access_token=${accessToken}`
          );
          if (accountResp.ok) {
            const accountData = await accountResp.json();
            if (accountData.instagram_business_account?.id) {
              igBusinessId = accountData.instagram_business_account.id;
              console.log('✅ Fetched IG Business ID on the fly:', igBusinessId);
            }
          } else {
            console.error('Failed to fetch account info:', await accountResp.text());
          }
        } catch (e) {
          console.error('Error fetching IG Business ID:', e);
        }
      }

      if (igBusinessId) {
        apiUrl = `https://graph.facebook.com/v21.0/${igBusinessId}/messages`;
      } else {
        console.error('❌ CRITICAL: No Instagram Business Account ID found. Cannot send message via Graph API.');
        // We will fail here or try 'me' knowing it will likely fail with (#3)
        // Returning specific error to help debugging
        return new Response(
          JSON.stringify({
            error: 'Configuration Error',
            details: 'Instagram Business Account ID not found. Please reconnect the channel.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const url = `${apiUrl}?access_token=${accessToken}`;
    console.log('🔗 API URL:', url.replace(accessToken, '[REDACTED]'));

    // Intentar enviar con etiqueta HUMAN_AGENT (permite ventana de 7 días)
    let messengerResponse = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'MESSAGE_TAG',
          tag: 'HUMAN_AGENT'
        })
      }
    )

    // Si falla por falta de permisos para HUMAN_AGENT, reintentar envío estándar
    if (!messengerResponse.ok) {
      const errorData = await messengerResponse.json()
      const errorCode = errorData.error?.code
      const errorSubcode = errorData.error?.error_subcode

      console.log(`⚠️ Initial send failed with code ${errorCode}/${errorSubcode}. Checking if retryable...`);

      // Retry conditions:
      // 1. Error #100 / 2018276: Cannot use "HUMAN_AGENT" tag without approval
      // 2. Error #3: "Application does not have the capability" (often triggered by missing specific features like HUMAN_AGENT)
      // 3. Error #10: "Permission denied" (generic permission issue)
      if (
        (errorCode === 100 && errorSubcode === 2018276) ||
        errorCode === 3 ||
        errorCode === 10
      ) {
        console.log('🔄 Retrying with standard send (messaging_type: RESPONSE)...')
        messengerResponse = await fetch(
          url,
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
      } else {
        // Si es otro error, devolverlo tal cual
        console.error(`${channelType} API error:`, JSON.stringify(errorData))
        return new Response(
          JSON.stringify({
            error: `Failed to send message to ${channelType}`,
            details: JSON.stringify(errorData)
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!messengerResponse.ok) {
      const errorData = await messengerResponse.text()
      console.error(`${channelType} API error (retry):`, errorData)
      return new Response(
        JSON.stringify({
          error: `Failed to send message to ${channelType}`,
          details: errorData
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messengerResult = await messengerResponse.json()

    // Check if message already exists (avoid duplicates)
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform_message_id', messengerResult.message_id)
      .limit(1)
      .single();

    if (existingMessage) {
      console.log('⚠️ Message already exists with platform_message_id:', messengerResult.message_id);
      return new Response(
        JSON.stringify({
          success: true,
          message_id: messengerResult.message_id,
          conversation_id: conversation_id,
          note: 'Message already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save message to database with new structure (Option 2)
    const messageData = {
      conversation_id: conversation_id,
      content: message,
      sender_type: sender_type, // 'agent' or 'ia' based on request
      is_automated: sender_type === 'ia', // true for IA, false for agent
      sender_name: sender_name || (sender_type === 'ia' ? 'IA Assistant' : sender_type === 'agent' ? 'Agente' : 'Cliente'),
      platform_message_id: messengerResult.message_id, // Platform message ID (Facebook/Instagram)
      metadata: {
        platform: channelType,
        platform_message_id: messengerResult.message_id,
        timestamp: new Date().toISOString(),
        sent_via: 'send-message-function', // Mark messages sent via this function
        api_endpoint: apiUrl
      }
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert(messageData)

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

    // Increment message count
    // Increment message count ONLY for IA messages
    if (profile && sender_type === 'ia') {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ messages_sent_this_month: (profile.messages_sent_this_month || 0) + 1 })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating message count:', updateError);
      }
    }

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
