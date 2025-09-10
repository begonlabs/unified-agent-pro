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

  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ 
      last_message_at: new Date().toISOString(),
      status: 'open'
    })
    .eq('id', conversation.id);

  console.log('✅ WhatsApp message saved successfully:', {
    conversation_id: conversation.id,
    sender_type: messageData.sender_type,
    platform_message_id: messageId
  });

  // Generate AI response if enabled
  if (messageText && conversation.ai_enabled) {
    try {
      console.log('🤖 Generating AI response for WhatsApp:', conversation.id);
      
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
        messageCount: conversationHistory.length
      });

      const aiResponse = await generateAIResponse(messageText, aiConfig, conversationHistory);

      if (aiResponse.success && aiResponse.response) {
        console.log('🤖 AI response generated successfully for WhatsApp');

        const { error: aiMessageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversation.id,
            content: aiResponse.response,
            sender_type: 'ia',
            sender_name: 'IA Assistant',
            is_automated: true,
            platform_message_id: `ai_wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metadata: {
              confidence_score: aiResponse.confidence_score,
              ai_model: 'gpt-4o-mini',
              response_time: aiConfig.response_time || 0,
              platform: 'whatsapp'
            }
          });

        if (aiMessageError) {
          console.error('❌ Error saving AI message for WhatsApp:', aiMessageError);
          return;
        }

        console.log('✅ AI response for WhatsApp saved successfully');
        
        // Send AI message via WhatsApp Business API
        try {
          const accessToken = channel.channel_config.access_token;
          const businessPhoneNumberId = phoneNumberId;
          
          console.log('📤 Sending AI message via WhatsApp to:', senderPhoneNumber);
          
          const whatsappApiResponse = await fetch(
            `https://graph.facebook.com/v23.0/${businessPhoneNumberId}/messages`,
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
          } else {
            const result = await whatsappApiResponse.json();
            console.log('✅ AI message sent to WhatsApp:', result.messages?.[0]?.id);
            
            // Update the platform_message_id with the real WhatsApp message ID
            if (result.messages?.[0]?.id) {
              await supabase
                .from('messages')
                .update({ platform_message_id: result.messages[0].id })
                .eq('platform_message_id', `ai_wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            }
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

  // Update message status in database if needed
  const { error: updateError } = await supabase
    .from('messages')
    .update({
      metadata: supabase.raw(`
        COALESCE(metadata, '{}'::jsonb) || 
        jsonb_build_object(
          'delivery_status', '${status.status}',
          'status_timestamp', '${status.timestamp}'
        )
      `)
    })
    .eq('platform_message_id', status.id);

  if (updateError) {
    console.error('❌ Error updating message status:', updateError);
  } else {
    console.log('✅ Message status updated successfully');
  }
}