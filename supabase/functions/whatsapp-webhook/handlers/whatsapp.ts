// whatsapp-webhook/handlers/whatsapp.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// WhatsApp Business API Event Handler

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';

// Interfaces for WhatsApp events
interface WhatsAppMessage {
  from?: string;
  id?: string;
  timestamp?: string;
  text?: {
    body?: string;
  };
  type?: string;
  context?: {
    from?: string;
    id?: string;
  };
}

interface WhatsAppStatus {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  conversation?: {
    id?: string;
    expiration_timestamp?: string;
    origin?: {
      type?: string;
    };
  };
  pricing?: {
    billable?: boolean;
    pricing_model?: string;
    category?: string;
    type?: string;
  };
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: {
      details?: string;
    };
    href?: string;
  }>;
}

interface WhatsAppContact {
  profile?: {
    name?: string;
  };
  wa_id?: string;
}

interface WhatsAppMetadata {
  display_phone_number?: string;
  phone_number_id?: string;
}

interface WhatsAppEvent {
  message?: WhatsAppMessage;
  status?: WhatsAppStatus;
  contacts?: WhatsAppContact[];
  metadata?: WhatsAppMetadata;
  type: 'message' | 'status';
}

interface CommunicationChannel {
  id: string;
  user_id: string;
  channel_config: {
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    display_phone_number: string;
  };
}

interface CRMClient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  user_id: string;
}

interface Conversation {
  id: string;
  channel: string;
  channel_thread_id: string;
  client_id: string;
  user_id: string;
  status: string;
  last_message_at: string;
  ai_enabled?: boolean;
}

/**
 * Processes a WhatsApp event, saves the message to the database,
 * and associates it with the corresponding channel.
 * @param event - Event received from the WhatsApp webhook
 * @returns Promise<void>
 */
export async function handleWhatsAppEvent(event: WhatsAppEvent): Promise<void> {
  try {
    console.log('🎯 Processing WhatsApp event:', {
      type: event.type,
      has_message: !!event.message,
      has_status: !!event.status,
      phone_number_id: event.metadata?.phone_number_id
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle message events
    if (event.type === 'message' && event.message) {
      await handleIncomingMessage(event, supabase);
    }

    // Handle status events (delivered, read, etc.)
    if (event.type === 'status' && event.status) {
      await handleMessageStatus(event, supabase);
    }

  } catch (error) {
    console.error('Critical error in handleWhatsAppEvent:', error instanceof Error ? error.message : error);
  }
}

/**
 * Handles incoming WhatsApp messages
 */
async function handleIncomingMessage(event: WhatsAppEvent, supabase: SupabaseClient): Promise<void> {
  const { message, contacts, metadata } = event;

  if (!message?.text?.body || !message.from || !metadata?.phone_number_id) {
    console.log('⚠️ Event ignored: Not a valid text message or missing required fields.');
    return;
  }

  const messageText = message.text.body;
  const senderPhoneNumber = message.from;
  const messageId = message.id;
  const phoneNumberId = metadata.phone_number_id;
  const timestamp = message.timestamp;

  console.log(`📝 [WhatsApp] Message received from ${senderPhoneNumber} for business ${phoneNumberId}: "${messageText}"`);

  // 🔥 CRITICAL: Check if this message was already processed (prevent duplicates)
  if (messageId) {
    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id, created_at')
      .eq('platform_message_id', messageId)
      .limit(1)
      .single();

    if (existingMessage) {
      console.log('⏭️ Skipping WhatsApp message - already processed:', {
        platform_message_id: messageId,
        existing_message_id: existingMessage.id,
        created_at: existingMessage.created_at,
        duplicate_prevention: 'WhatsApp webhook duplicate detected'
      });
      return; // Exit early - message already processed
    }
  }

  // Find the WhatsApp channel for this phone number ID
  const { data: channel, error: channelError } = await supabase
    .from('communication_channels')
    .select('*')
    .eq('channel_config->>phone_number_id', phoneNumberId)
    .eq('channel_type', 'whatsapp')
    .single();

  if (channelError || !channel) {
    console.error('❌ No WhatsApp channel found for phone_number_id:', phoneNumberId, channelError?.message);
    return;
  }

  console.log('✅ Found WhatsApp channel:', { id: channel.id, user_id: channel.user_id });

  // Find or create client
  let client: CRMClient;
  const { data: existingClient, error: clientSearchError } = await supabase
    .from('crm_clients')
    .select('*')
    .eq('user_id', channel.user_id)
    .eq('phone', senderPhoneNumber)
    .single();

  if (existingClient && !clientSearchError) {
    client = existingClient;
    console.log('✅ Found existing client:', client.id);
  } else {
    // Get contact name from WhatsApp if available
    const contactName = contacts?.find(c => c.wa_id === senderPhoneNumber)?.profile?.name;
    const clientName = contactName || `WhatsApp ${senderPhoneNumber.slice(-4)}`;

    const { data: newClient, error: clientCreateError } = await supabase
      .from('crm_clients')
      .insert({
        user_id: channel.user_id,
        name: clientName,
        phone: senderPhoneNumber,
        status: 'active',
        source: 'whatsapp'
      })
      .select()
      .single();

    if (clientCreateError || !newClient) {
      console.error('❌ Error creating client:', clientCreateError);
      return;
    }

    client = newClient;
    console.log('✅ Created new client:', client.id);
  }

  // Find or create conversation
  let conversation: Conversation;
  const threadId = senderPhoneNumber; // Use phone number as thread ID

  const { data: existingConv, error: convSearchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', channel.user_id)
    .eq('client_id', client.id)
    .eq('channel', 'whatsapp')
    .eq('channel_thread_id', threadId)
    .single();

  if (existingConv && !convSearchError) {
    conversation = existingConv;
    console.log('✅ Found existing conversation:', conversation.id);
  } else {
    // Create new conversation
    const { data: newConv, error: convCreateError } = await supabase
      .from('conversations')
      .insert({
        user_id: channel.user_id,
        client_id: client.id,
        channel: 'whatsapp',
        channel_thread_id: threadId,
        status: 'open',
        last_message_at: new Date().toISOString(),
        ai_enabled: true // Default enable AI
      })
      .select()
      .single();

    if (convCreateError || !newConv) {
      console.error('❌ Error creating conversation:', convCreateError);
      return;
    }

    conversation = newConv;
    console.log('✅ Created new conversation:', conversation.id);
  }

  // Save message with new structure
  const messageData = {
    conversation_id: conversation.id,
    content: messageText,
    sender_type: 'client',
    is_automated: false,
    sender_name: client.name,
    platform_message_id: messageId, // WhatsApp message ID
    metadata: {
      platform: 'whatsapp',
      sender_phone: senderPhoneNumber,
      phone_number_id: phoneNumberId,
      timestamp: timestamp,
      message_type: message.type || 'text'
    }
  };

  const { error: messageError } = await supabase
    .from('messages')
    .insert(messageData);

  if (messageError) {
    console.error('❌ Error saving message:', messageError);
    return;
  }

  // Update conversation last_message_at and increment unread_count for client messages
  const { data: convData } = await supabase
    .from('conversations')
    .select('unread_count')
    .eq('id', conversation.id)
    .single();

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      status: 'open',
      unread_count: (convData?.unread_count || 0) + 1
    })
    .eq('id', conversation.id);

  console.log('✅ WhatsApp message saved successfully:', {
    conversation_id: conversation.id,
    sender_type: messageData.sender_type,
    platform_message_id: messageId
  });

  // Generate AI response if enabled (only for incoming messages, not for client messages)
  if (messageText && conversation.ai_enabled && messageData.sender_type === 'client') {
    try {
      console.log('🤖 Generating AI response for WhatsApp:', conversation.id);

      // 🔥 CRITICAL: Check if we already have an AI response right after this specific client message
      const { data: clientMessage } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('platform_message_id', messageId)
        .eq('conversation_id', conversation.id)
        .single();

      if (clientMessage) {
        // Check if there's already an IA message created immediately after this client message
        const { data: existingAIResponse } = await supabase
          .from('messages')
          .select('id, created_at')
          .eq('conversation_id', conversation.id)
          .eq('sender_type', 'ia')
          .gte('created_at', clientMessage.created_at)
          .lte('created_at', new Date(new Date(clientMessage.created_at).getTime() + 30000).toISOString())
          .limit(1)
          .single();

        if (existingAIResponse) {
          console.log('⏭️ Skipping AI response - already responded to this specific WhatsApp message:', {
            client_message_id: clientMessage.id,
            existing_ai_response_id: existingAIResponse.id
          });
          return;
        }
      }

      const { data: aiConfig } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('user_id', conversation.user_id)
        .single();

      if (!aiConfig) {
        console.log('⚠️ No AI configuration found for user:', conversation.user_id);
        return;
      }

      // Check if AI should respond to this message
      if (!shouldAIRespond(messageText, aiConfig)) {
        console.log('🤖 AI decided not to respond to this WhatsApp message');
        return;
      }

      const { data: recentMessages } = await supabase
        .from('messages')
        .select('id, content, sender_type, sender_name, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationHistory = recentMessages?.reverse().map(msg => ({
        id: msg.id || crypto.randomUUID(),
        content: msg.content,
        sender_type: msg.sender_type === 'ia' ? 'ia' : 'user',
        sender_name: msg.sender_name || 'Usuario',
        created_at: msg.created_at,
        metadata: {}
      })) || [];

      console.log('📜 WhatsApp conversation history loaded:', {
        messageCount: conversationHistory.length,
        oldestMessage: conversationHistory[0]?.content,
        newestMessage: conversationHistory[conversationHistory.length - 1]?.content
      });

      console.log('🧠 Generating AI response using conversation context...');
      const aiResponse = await generateAIResponse(messageText, aiConfig, conversationHistory);

      if (aiResponse.success && aiResponse.response) {
        console.log('🤖 AI response generated successfully for WhatsApp');

        // Generate temporary message ID
        const tempMessageId = `ai_wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const { data: savedMessage, error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            content: aiResponse.response,
            sender_type: 'ia',
            sender_name: 'IA Assistant',
            is_automated: true,
            platform_message_id: tempMessageId,
            metadata: {
              confidence_score: aiResponse.confidence_score,
              ai_model: 'gpt-4o-mini',
              response_time: aiConfig.response_time || 0,
              platform: 'whatsapp'
            }
          })
          .select()
          .single();

        if (aiMessageError) {
          console.error('❌ Error saving AI message for WhatsApp:', aiMessageError);
          return;
        }

        console.log('✅ AI response for WhatsApp saved successfully');

        // Send AI message via WhatsApp Cloud API
        try {
          const accessToken = channel.channel_config.access_token;
          const businessPhoneNumberId = phoneNumberId;
          const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v23.0';

          console.log('📤 Sending AI message via WhatsApp Cloud API to:', senderPhoneNumber);
          console.log('🔧 Using Meta Graph API version:', graphVersion);

          // Use Cloud API endpoint with configurable version
          const whatsappApiResponse = await fetch(
            `https://graph.facebook.com/${graphVersion}/${businessPhoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: senderPhoneNumber,
                type: 'text',
                text: {
                  body: aiResponse.response
                }
              })
            }
          );

          if (!whatsappApiResponse.ok) {
            const errorData = await whatsappApiResponse.text();
            console.error('❌ Error sending message via WhatsApp API:', errorData);

            // Try to parse error for 24h window issue
            try {
              const errorJson = JSON.parse(errorData);
              if (errorJson.error?.code === 131047) {
                console.error('⚠️ WhatsApp 24h window error - message cannot be sent', {
                  error_code: 131047,
                  message: 'Outside 24h customer service window',
                  solution: 'User needs to send template message or wait for customer to initiate conversation'
                });
              }
            } catch (parseError) {
              // Ignore parse errors
            }
          } else {
            const result = await whatsappApiResponse.json();
            console.log('✅ AI message sent to WhatsApp:', result.messages?.[0]?.id);

            // Update the platform_message_id with the real WhatsApp message ID
            if (result.messages?.[0]?.id && savedMessage) {
              await supabase
                .from('messages')
                .update({ platform_message_id: result.messages[0].id })
                .eq('id', savedMessage.id);

              console.log('✅ Message ID updated in database:', result.messages[0].id);
            }

            // Update conversation timestamp (don't increment unread_count for IA messages)
            await supabase
              .from('conversations')
              .update({
                last_message_at: new Date().toISOString(),
                status: 'open'
                // Note: NOT incrementing unread_count for IA responses
              })
              .eq('id', conversation.id);
          }
        } catch (sendError) {
          console.error('❌ Error sending automatic WhatsApp message:', sendError);
        }

      } else {
        console.error('❌ Error generating AI response for WhatsApp:', aiResponse.error);
      }

    } catch (error) {
      console.error('❌ Error in automatic AI process for WhatsApp:', error);
    }
  }
}

/**
 * Handles WhatsApp message status updates (delivered, read, etc.)
 */
async function handleMessageStatus(event: WhatsAppEvent, supabase: SupabaseClient): Promise<void> {
  const { status, metadata } = event;

  if (!status?.id || !status.status) {
    console.log('⚠️ Status event ignored: Missing required fields.');
    return;
  }

  console.log('📊 Processing WhatsApp status update:', {
    message_id: status.id,
    status: status.status,
    recipient_id: status.recipient_id,
    phone_number_id: metadata?.phone_number_id
  });

  // First, get the current message to merge metadata
  const { data: currentMessage } = await supabase
    .from('messages')
    .select('metadata')
    .eq('platform_message_id', status.id)
    .single();

  // Merge existing metadata with new status information
  const updatedMetadata = {
    ...(currentMessage?.metadata || {}),
    delivery_status: status.status,
    status_timestamp: status.timestamp,
    recipient_id: status.recipient_id,
    conversation_info: status.conversation,
    pricing_info: status.pricing,
    // Include error information if status is failed
    ...(status.status === 'failed' && status.errors ? {
      error_info: status.errors,
      last_error: {
        code: status.errors[0]?.code,
        title: status.errors[0]?.title,
        message: status.errors[0]?.message,
        details: status.errors[0]?.error_data?.details
      }
    } : {})
  };

  // Update message status in database
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      metadata: updatedMetadata
    })
    .eq('platform_message_id', status.id);

  if (updateError) {
    console.error('❌ Error updating message status:', updateError);
  } else {
    // Log success with additional context for failed messages
    if (status.status === 'failed' && status.errors) {
      console.error('⚠️ WhatsApp message delivery failed:', {
        message_id: status.id,
        error_code: status.errors[0]?.code,
        error_title: status.errors[0]?.title,
        error_details: status.errors[0]?.error_data?.details,
        recipient_id: status.recipient_id,
        // Helpful context for 24h window error
        is_24h_window_error: status.errors[0]?.code === 131047,
        solution: status.errors[0]?.code === 131047
          ? 'Use Template Messages for re-engagement outside 24h window'
          : 'Check error code at https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/'
      });
    } else {
      console.log('✅ Message status updated successfully:', {
        message_id: status.id,
        new_status: status.status
      });
    }
  }
}