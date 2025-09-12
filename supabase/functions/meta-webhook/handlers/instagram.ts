// meta-webhook/handlers/instagram.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// supabase-project/volumes/meta-webhook/handlers/instagram.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';

// interface for Instagram event
interface InstagramEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    text?: string;
    mid?: string;
    is_echo?: boolean;
  };
}

// interface for communication channel
interface CommunicationChannel {
  id: string;
  user_id: string;
  channel_config: {
    instagram_user_id: string;
    instagram_business_account_id?: string; // 🔥 NEW: Business Account ID for messaging
    username: string;
    access_token: string;
    account_type: string;
    messaging_available?: boolean;
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
 * Processes an Instagram event, saves the message to the database,
 * and associates it with the corresponding channel.
 * @param event - Event received from the Instagram webhook
 * @returns Promise<void>
 */
export async function handleInstagramEvent(event: InstagramEvent): Promise<void> {
  try {
    console.log('🎯 Processing Instagram event:', {
      has_message: !!event.message,
      sender_id: event.sender?.id,
      recipient_id: event.recipient?.id
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

    // extract event information
    const senderId = event.sender?.id;
    const pageId = event.recipient?.id;
    const timestamp = event.timestamp;
    const message = event.message;

    // validate that the event is a valid text message (now accepting echo messages too)
    if (!message?.text || !senderId || !pageId) {
      console.log('⚠️ Event ignored: Not a valid text message.');
      return;
    }

    const { text, mid: messageId } = message;

    console.log(`📝 [Instagram] Message received from ${senderId} for page ${pageId}: "${text}"`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine if this is an echo message early
    const isEcho = message.is_echo || false;

    // Skip echo messages from application-sent messages (IA responses and frontend messages)
    if (isEcho) {
      console.log('🔍 Instagram echo message detected, checking if should be skipped:', {
        senderId,
        pageId,
        text,
        messageId
      });
      
      // First check if this exact platform_message_id was already processed
      if (messageId) {
        const { data: existingMessage } = await supabase
          .from('messages')
          .select('id')
          .eq('platform_message_id', messageId)
          .limit(1)
          .single();
        
        if (existingMessage) {
          console.log('⏭️ Skipping Instagram echo message - platform_message_id already exists:', messageId);
          return;
        }
      }
      
      // Check if there's a recent IA message with the same content (last 60 seconds)
      const { data: recentIAMessage } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('content', text)
        .eq('sender_type', 'ia')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .limit(1)
        .single();
      
      if (recentIAMessage) {
        console.log('⏭️ Skipping Instagram echo message - corresponds to recent IA response:', recentIAMessage.id);
        return;
      }
      
      // Check if there's a recent agent message with same content (from frontend)
      const { data: recentAgentMessage } = await supabase
        .from('messages')
        .select('id, created_at, sender_type')
        .eq('content', text)
        .eq('sender_type', 'agent')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .limit(1)
        .single();
      
      if (recentAgentMessage) {
        console.log('⏭️ Skipping Instagram echo message - corresponds to recent agent message from frontend:', recentAgentMessage.id);
        return;
      }
    }
    
    // For Instagram, we need to find the channel by Business Account ID (for messaging)
    // The Business Account ID is what receives messages in webhooks
    // For echo messages: sender = business account, recipient = user → business_account_id = sender  
    // For normal messages: sender = user, recipient = business account → business_account_id = recipient
    const webhookBusinessId = isEcho ? senderId : pageId;
    
    console.log('🔍 Looking for Instagram channel with business account ID:', webhookBusinessId, {
      isEcho,
      senderId,
      pageId,
      logic: isEcho ? 'echo: using senderId as business_account_id' : 'normal: using pageId as business_account_id'
    });
    
    // 🔥 NEW: Try to find by Business Account ID first, then fallback to User ID for backwards compatibility
    let channel: CommunicationChannel | null = null;
    let channelError: unknown = null;
    
    // First attempt: Search by Instagram Business Account ID (new field)
    const { data: businessChannel, error: businessError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('channel_config->>instagram_business_account_id', webhookBusinessId)
      .eq('channel_type', 'instagram')
      .maybeSingle();
    
    if (businessChannel && !businessError) {
      channel = businessChannel;
      console.log('✅ Found Instagram channel by Business Account ID');
    } else {
      // Fallback: Search by Instagram User ID (old field, for backwards compatibility)  
      console.log('🔄 Trying fallback search by User ID...');
      const { data: userChannel, error: userError } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('channel_config->>instagram_user_id', webhookBusinessId)
        .eq('channel_type', 'instagram')
        .maybeSingle();
      
      if (userChannel && !userError) {
        channel = userChannel;
        console.log('✅ Found Instagram channel by User ID (fallback)');
      } else {
        channelError = userError || businessError;
        console.log('❌ No Instagram channel found with either Business Account ID or User ID');
      }
    }

    if (channelError || !channel) {
      console.error('❌ No Instagram channel found for business account ID:', webhookBusinessId, channelError?.message);
      return;
    }

    console.log('✅ Found Instagram channel:', { id: channel.id, user_id: channel.user_id });
    
    console.log('🔍 Echo detection:', {
      isEcho,
      hasIsEcho: Object.prototype.hasOwnProperty.call(message, 'is_echo'),
      isEchoValue: message.is_echo,
      senderId,
      pageId
    });

    // Find or create client (handle echo messages)
    let client: CRMClient;
    
    // For Instagram messages:
    // - Normal message: sender = user, recipient = page → client = sender
    // - Echo message: sender = page, recipient = user → client = recipient (pageId)
    // BUT: pageId is recipient in normal messages, so for echo we need recipient which is pageId
    const realUserId = isEcho ? pageId : senderId;
    
    console.log('👤 Client identification:', {
      isEcho,
      realUserId,
      logic: isEcho ? 'echo: using pageId as user' : 'normal: using sender as user'
    });
    
    const { data: existingClient, error: clientSearchError } = await supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('phone', realUserId)
      .single();

    if (existingClient && !clientSearchError) {
      client = existingClient;
      console.log('✅ Found existing client:', client.id);
    } else {
      // Create new client
      const clientName = `Instagram User ${realUserId.slice(-4)}`;
        
      const { data: newClient, error: clientCreateError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: clientName,
          phone: realUserId,
          status: 'active',
          source: 'instagram'
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

    // Find or create conversation (use consistent thread ID)
    let conversation: Conversation;
    // Thread ID should always be the real user ID for consistency
    const threadId = realUserId;
    
    console.log('💬 Conversation identification:', {
      threadId,
      realUserId,
      clientId: client.id
    });
    
    const { data: existingConv, error: convSearchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('client_id', client.id)
      .eq('channel', 'instagram')
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
          channel: 'instagram',
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

    // Determine sender type based on echo status
    const senderType = isEcho ? 'agent' : 'client'; // Echo = outgoing (agent), Not echo = incoming (client)
    const senderName = isEcho ? 'Agente' : client.name;
    
    console.log('📋 Message classification:', {
      isEcho,
      senderType,
      senderName,
      logic: isEcho ? 'Echo message → agent (outgoing)' : 'Normal message → client (incoming)'
    });

    // Save message with new structure
    const messageData = {
      conversation_id: conversation.id,
      content: text,
      sender_type: senderType,
      is_automated: false, // Could be automated if it's a bot message
      sender_name: senderName,
      platform_message_id: messageId, // Instagram message ID
      metadata: {
        platform: 'instagram',
        sender_id: senderId,
        recipient_id: pageId,
        timestamp: timestamp,
        is_echo: isEcho
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

    console.log('✅ Instagram message saved successfully:', {
      conversation_id: conversation.id,
      sender_type: messageData.sender_type,
      platform_message_id: messageId,
      is_echo: isEcho,
      direction: isEcho ? 'outgoing' : 'incoming'
    });

    if (!isEcho && text && conversation.ai_enabled) {
      try {
        console.log('🤖 Generando respuesta automática de IA para Instagram:', conversation.id);
        
  
        const { data: aiConfig } = await supabase
          .from('ai_configurations')
          .select('*')
          .eq('user_id', conversation.user_id)
          .single();

        if (!aiConfig) {
          console.log('⚠️ No se encontró configuración de IA para el usuario:', conversation.user_id);
          return;
        }

        // Verificar si la IA debe responder a este mensaje
        if (!shouldAIRespond(text, aiConfig)) {
          console.log('🤖 IA decide no responder a este mensaje de Instagram');
          return;
        }

        const { data: recentMessages } = await supabase
          .from('messages')
          .select('id, content, sender_type, sender_name, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false }) // Del más reciente al más antiguo
          .limit(10);

        const conversationHistory = recentMessages?.reverse().map(msg => ({
          id: msg.id || crypto.randomUUID(),
          content: msg.content,
          sender_type: msg.sender_type === 'ia' ? 'ia' : 'user', // Normalizar tipos
          sender_name: msg.sender_name || 'Usuario',
          created_at: msg.created_at,
          metadata: {}
        })) || [];

        console.log('📜 Historial de conversación Instagram cargado:', {
          messageCount: conversationHistory.length,
          oldestMessage: conversationHistory[0]?.content,
          newestMessage: conversationHistory[conversationHistory.length - 1]?.content
        });


        const aiResponse = await generateAIResponse(text, aiConfig, conversationHistory);

        if (aiResponse.success && aiResponse.response) {
          console.log('🤖 Respuesta de IA generada exitosamente para Instagram');

          const { error: aiMessageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              content: aiResponse.response,
              sender_type: 'ia',
              sender_name: 'IA Assistant',
              is_automated: true,
              platform_message_id: `ai_ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              metadata: {
                confidence_score: aiResponse.confidence_score,
                ai_model: 'gpt-4o-mini',
                response_time: aiConfig.response_time || 0,
                platform: 'instagram'
              }
            });

          if (aiMessageError) {
            console.error('❌ Error guardando mensaje de IA para Instagram:', aiMessageError);
            return;
          }

          console.log('✅ Respuesta de IA para Instagram guardada exitosamente');
          
          // Enviar mensaje automático de IA por Instagram Messaging API
          try {
            const accessToken = channel.channel_config.access_token;
            const igUserId = realUserId; // El ID del usuario de Instagram
            
            console.log('📤 Enviando mensaje de IA por Instagram a:', igUserId);
            console.log('🔑 Using Instagram access token:', accessToken ? 'Present' : 'Missing');
            
            const instagramApiResponse = await fetch(
              `https://graph.instagram.com/v23.0/me/messages?access_token=${accessToken}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  recipient: { id: igUserId },
                  message: { text: aiResponse.response },
                  messaging_type: 'RESPONSE'
                })
              }
            );

            if (!instagramApiResponse.ok) {
              const errorData = await instagramApiResponse.text();
              console.error('❌ Error enviando mensaje por Instagram API:', errorData);
            } else {
              const result = await instagramApiResponse.json();
              console.log('✅ Mensaje de IA enviado a Instagram:', result.message_id);
              
              // Actualizar el platform_message_id con el ID real de Instagram
              await supabase
                .from('messages')
                .update({ platform_message_id: result.message_id })
                .eq('platform_message_id', `ai_ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            }
          } catch (sendError) {
            console.error('❌ Error enviando mensaje automático de Instagram:', sendError);
          }

        } else {
          console.error('❌ Error generando respuesta de IA para Instagram:', aiResponse.error);
        }

      } catch (error) {
        console.error('❌ Error en proceso de IA automática para Instagram:', error);
      }
    }

  } catch (error) {
    console.error('Critical error in handleInstagramEvent:', error instanceof Error ? error.message : error);
  }
}