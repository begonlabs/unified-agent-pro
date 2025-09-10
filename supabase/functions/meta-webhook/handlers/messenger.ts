// meta-webhook/handlers/messanger.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Facebook Messenger Event Handler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';

interface MessengerEvent {
  sender?: { id: string };
  recipient?: { id: string };
  timestamp?: number;
  message?: {
    text?: string;
    mid?: string;
    is_echo?: boolean;
    attachments?: Array<{
      type?: string;
      payload?: { url?: string };
    }>;
  };
  postback?: {
    payload?: string;
    title?: string;
  };
  delivery?: {
    mids?: string[];
    watermark?: number;
  };
  read?: {
    watermark?: number;
  };
}

interface CommunicationChannel {
  id: string;
  user_id: string;
  channel_config: {
    page_id: string;
    page_name: string;
    page_access_token: string;
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

interface Message {
  conversation_id: string;
  content: string;
  sender_type: string;
  is_automated: boolean;
  sender_name?: string;
}

/**
 * Send AI response to Facebook Messenger
 */
async function sendAIResponseToFacebook(
  message: string, 
  pageId: string, 
  recipientId: string
): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener token de acceso de la página
    const { data: channel } = await supabase
      .from('communication_channels')
      .select('channel_config')
      .eq('channel_type', 'facebook')
      .eq('channel_config->>page_id', pageId)
      .single();

    if (!channel?.channel_config?.page_access_token) {
      console.error('❌ No se encontró token de acceso para la página:', pageId);
      return false;
    }

    const pageAccessToken = channel.channel_config.page_access_token;

    // Enviar mensaje a Facebook Messenger API
    const response = await fetch(
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
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error enviando mensaje de IA a Facebook:', response.status, errorData);
      return false;
    }

    const result = await response.json();
    console.log('✅ Mensaje de IA enviado a Facebook:', result.message_id);
    return true;

  } catch (error) {
    console.error('❌ Error en sendAIResponseToFacebook:', error);
    return false;
  }
}

export async function handleMessengerEvent(event: MessengerEvent): Promise<void> {
  try {
    console.log('🎯 Processing Messenger event:', {
      has_message: !!event.message,
      has_postback: !!event.postback,
      has_delivery: !!event.delivery,
      has_read: !!event.read,
      sender_id: event.sender?.id,
      recipient_id: event.recipient?.id
    });

    // Determine the type of content and extract relevant data
    let messageText: string | undefined;
    let eventType: string = 'unknown';
    let shouldProcess: boolean = false;
    let messageId: string | undefined;
    
    if (event.message?.text) {
      messageText = event.message.text;
      messageId = event.message.mid;
      eventType = event.message.is_echo ? 'echo_message' : 'text_message';
      shouldProcess = true;
    } else if (event.postback?.payload) {
      messageText = event.postback.title || event.postback.payload;
      eventType = 'postback';
      shouldProcess = true;
    } else if (event.delivery?.mids?.length > 0) {
      messageText = `Message delivered: ${event.delivery.mids.length} message(s)`;
      eventType = 'delivery';
      shouldProcess = false; // Don't save delivery events to DB
    } else if (event.read?.watermark) {
      messageText = `Message read at ${new Date(event.read.watermark * 1000).toISOString()}`;
      eventType = 'read';
      shouldProcess = false; // Don't save read events to DB
    }

    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;

    if (!messageText || !senderId || !recipientId) {
      console.log('⚠️ Missing required fields:', {
        messageText: !!messageText,
        senderId: !!senderId,
        recipientId: !!recipientId,
        eventType
      });
      return;
    }

    console.log('📝 Event details:', {
      eventType,
      messageText,
      senderId,
      recipientId,
      messageId,
      timestamp: event.timestamp,
      shouldProcess
    });

    // Only process events that should be saved to database
    if (!shouldProcess) {
      console.log('📊 Logging event (not saving to DB):', {
        event_type: eventType,
        sender_id: senderId,
        page_id: recipientId,
        content: messageText
      });
      return;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return;
    }

    console.log('🔧 Supabase connection details:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine if this is an echo message early
    const isEcho = event.message?.is_echo || false;

    // Skip echo messages from application-sent messages (IA responses and frontend messages)
    if (isEcho) {
      console.log('🔍 Echo message detected, checking if should be skipped:', {
        senderId,
        recipientId,
        messageText,
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
          console.log('⏭️ Skipping echo message - platform_message_id already exists:', messageId);
          return;
        }
      }
      
      // Check if there's a recent IA message with the same content (last 60 seconds)
      const { data: recentIAMessage } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('content', messageText)
        .eq('sender_type', 'ia')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .limit(1)
        .single();
      
      if (recentIAMessage) {
        console.log('⏭️ Skipping echo message - corresponds to recent IA response:', recentIAMessage.id);
        return;
      }
      
      // Check if there's a recent agent message with same content (from frontend)
      const { data: recentAgentMessage } = await supabase
        .from('messages')
        .select('id, created_at, sender_type')
        .eq('content', messageText)
        .eq('sender_type', 'agent')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last 60 seconds
        .limit(1)
        .single();
      
      if (recentAgentMessage) {
        console.log('⏭️ Skipping echo message - corresponds to recent agent message from frontend:', recentAgentMessage.id);
        return;
      }
    }

    // Determine the page ID based on echo status
    const pageId = isEcho ? senderId : recipientId;
    
    console.log('🔍 Looking for channel with page_id:', pageId, {
      isEcho,
      senderId,
      recipientId,
      logic: isEcho ? 'echo: using senderId as pageId' : 'normal: using recipientId as pageId'
    });
    
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('channel_config->>page_id', pageId)
      .eq('channel_type', 'facebook')
      .single();

    if (channelError || !channel) {
      console.error('❌ No channel found for page:', pageId, channelError?.message);
      return;
    }

    console.log('✅ Found channel:', { id: channel.id, user_id: channel.user_id });
    
    console.log('🔍 Echo detection:', {
      isEcho,
      hasIsEcho: event.message ? Object.prototype.hasOwnProperty.call(event.message, 'is_echo') : false,
      isEchoValue: event.message?.is_echo,
      senderId,
      recipientId
    });

    // Find or create client (handle echo messages)
    let client: CRMClient;
    const realUserId = isEcho ? recipientId : senderId;
    
    console.log('👤 Client identification:', {
      isEcho,
      realUserId,
      logic: isEcho ? 'echo: using recipient as user' : 'normal: using sender as user'
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
      const clientName = `Facebook User ${realUserId.slice(-4)}`;
        
      const { data: newClient, error: clientCreateError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: clientName,
          phone: realUserId,
          status: 'active',
          source: 'facebook'
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
      .eq('channel', 'facebook')
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
          channel: 'facebook',
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
    const senderType = isEcho ? 'agent' : 'client';
    const senderName = isEcho ? 'Agente' : client.name;
    
    console.log('📋 Message classification:', {
      isEcho,
      senderType,
      senderName,
      logic: isEcho ? 'Echo message → agent (outgoing)' : 'Normal message → client (incoming)'
    });

    // Save message
    const messageData = {
      conversation_id: conversation.id,
      content: messageText,
      sender_type: senderType,
      is_automated: false,
      sender_name: senderName,
      platform_message_id: messageId,
      metadata: {
        platform: 'facebook',
        sender_id: senderId,
        recipient_id: recipientId,
        timestamp: event.timestamp,
        event_type: eventType,
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

    console.log('✅ Message saved successfully:', {
      conversation_id: conversation.id,
      sender_type: messageData.sender_type,
      platform_message_id: messageId,
      event_type: eventType,
      is_echo: isEcho,
      direction: isEcho ? 'outgoing' : 'incoming'
    });

    // 🤖 GENERAR RESPUESTA AUTOMÁTICA DE IA (solo para mensajes entrantes)
    if (!isEcho && eventType === 'text_message' && conversation.ai_enabled) {
      try {
        console.log('🤖 Generando respuesta automática de IA para conversación:', conversation.id);
        
        // Obtener configuración de IA del usuario
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
        if (!shouldAIRespond(messageText, aiConfig)) {
          console.log('🤖 IA decide no responder a este mensaje');
          return;
        }

        // 🔥 CORRECCIÓN: Obtener historial completo con formato correcto
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('id, content, sender_type, sender_name, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false }) // Del más reciente al más antiguo (como querías)
          .limit(10);

        // 🔥 CORRECCIÓN: Revertir orden y convertir a formato Message
        const conversationHistory = recentMessages?.reverse().map(msg => ({
          id: msg.id || crypto.randomUUID(),
          content: msg.content,
          sender_type: msg.sender_type === 'ia' ? 'ia' : 'user', // Normalizar tipos
          sender_name: msg.sender_name || 'Usuario',
          created_at: msg.created_at,
          metadata: {}
        })) || [];

        console.log('📜 Historial de conversación cargado:', {
          messageCount: conversationHistory.length,
          oldestMessage: conversationHistory[0]?.content,
          newestMessage: conversationHistory[conversationHistory.length - 1]?.content
        });

        // Generar respuesta de IA
        const aiResponse = await generateAIResponse(messageText, aiConfig, conversationHistory);

        if (aiResponse.success && aiResponse.response) {
          console.log('🤖 Respuesta de IA generada exitosamente');

          // Guardar respuesta de IA en la base de datos
          const { error: aiMessageError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversation.id,
              content: aiResponse.response,
              sender_type: 'ia',
              sender_name: 'IA Assistant',
              is_automated: true,
              platform_message_id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              metadata: {
                confidence_score: aiResponse.confidence_score,
                ai_model: 'gpt-4o-mini',
                response_time: aiConfig.response_time || 0,
                platform: 'facebook'
              }
            });

          if (aiMessageError) {
            console.error('❌ Error guardando mensaje de IA:', aiMessageError);
            return;
          }

          // Enviar respuesta de IA a Facebook Messenger
          await sendAIResponseToFacebook(aiResponse.response, recipientId, senderId);

          console.log('✅ Respuesta de IA enviada y guardada exitosamente');

        } else {
          console.error('❌ Error generando respuesta de IA:', aiResponse.error);
        }

      } catch (error) {
        console.error('❌ Error en proceso de IA automática:', error);
      }
    }

  } catch (error) {
    console.error('Critical error in handleMessengerEvent:', error);
  }
}