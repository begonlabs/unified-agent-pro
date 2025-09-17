// send-ai-message/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Send AI Message to Facebook Messenger with Memory System
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAIResponse, shouldAIRespond } from '../_shared/openai.ts'

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

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'ia';
  sender_name: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  has_new_messages?: boolean;
}

interface AIConfig {
  goals?: string;
  restrictions?: string;
  common_questions?: string;
  response_time?: number;
  knowledge_base?: string;
  faq?: string;
  is_active?: boolean;
}

// Simplified function to wait and get context with new message check
async function waitAndGetContextWithNewMessageCheck(
  supabase: SupabaseClient, 
  conversationId: string, 
  delaySeconds: number = 15,
  limit: number = 150
): Promise<{ context: Message[], hasNewMessages: boolean }> {
  console.log(`⏳ Esperando ${delaySeconds} segundos para verificar más mensajes...`);
  
  const currentTime = new Date().toISOString();
  
  await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
  
  const { data: contextData, error } = await supabase
    .rpc('get_conversation_context', {
      p_conversation_id: conversationId,
      p_limit: limit,
      p_after_timestamp: currentTime
    });
  
  if (error) {
    console.error('Error obteniendo contexto con verificación:', error);
    return { context: [], hasNewMessages: false };
  }
  
  if (!contextData || contextData.length === 0) {
    return { context: [], hasNewMessages: false };
  }
  
  // verify if there are new messages
  const hasNewMessages = contextData[0]?.has_new_messages || false;
  
  // convert to expected format and sort chronologically (oldest first)
  const context: Message[] = contextData
    .map(row => ({
      id: row.id,
      content: row.content,
      sender_type: row.sender_type,
      sender_name: row.sender_name,
      created_at: row.created_at,
      metadata: row.metadata
    }))
    .reverse();
  
  return { context, hasNewMessages };
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
      ai_model = 'gpt-3.5-turbo', 
      ai_prompt, 
      confidence_score 
    } = body

    if (!conversation_id || !message || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // initialize Supabase client
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

    console.log('🤖 Procesando petición con IA:', {
      conversation_id,
      user_id,
      ai_model,
      message_length: message.length
    })

    // get conversation details
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

    // get AI configuration for this user
    const { data: aiConfigData, error: aiConfigError } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('user_id', user_id)
      .single()

    if (aiConfigError) {
      console.log('⚠️No se encontró configuración de IA para el usuario, usando valores por defecto');
    }

    const aiConfig: AIConfig = aiConfigData || { is_active: true };

    // check if AI should respond
    if (!shouldAIRespond(message, aiConfig)) {
      console.log('🚫 No se debe responder a esta mensaje');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'AI determinado no responder a este mensaje',
          should_respond: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // **FUNCIONALIDAD MEJORADA: Esperar y obtener contexto en una sola operación**
    const randomDelay = Math.floor(Math.random() * (20 - 7 + 1)) + 7; // Entre 7 y 20 segundos
    
    console.log('📚 Esperando y obteniendo contexto de mensajes...');
    const { context: messageContext, hasNewMessages } = await waitAndGetContextWithNewMessageCheck(
      supabase,
      conversation_id,
      randomDelay,
      150
    );
    
    if (hasNewMessages) {
      console.log('🔄 Detectados más mensajes del usuario, esperando...');
      // Si hay más mensajes, terminar sin responder (el nuevo mensaje disparará otra ejecución)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Esperando por más mensajes del usuario',
          waited: true,
          delay_applied: randomDelay
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📖 Contexto obtenido: ${messageContext.length} mensajes`);

    console.log('🧠 Generando respuesta con IA usando contexto de conversación...');
    
    const aiResponse = await generateAIResponse(message, aiConfig, messageContext);
    
    if (!aiResponse.success) {
      console.error('Error generando respuesta de IA:', aiResponse.error);
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiGeneratedMessage = aiResponse.response;
    console.log('✅ Respuesta de IA generada con éxito');

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
    
    // Use correct access token based on channel type
    const accessToken = channelType === 'instagram' 
      ? channel.channel_config.access_token 
      : channel.channel_config.page_access_token;
    
    const recipientId = conversation.channel_thread_id

    console.log('📤 Sending AI message via', channelType, 'to:', recipientId)
    console.log('🔑 Access token present:', !!accessToken);

    // send message to Facebook/Instagram API
    const apiUrl = channelType === 'instagram' 
      ? `https://graph.instagram.com/v23.0/me/messages`
      : `https://graph.facebook.com/v23.0/me/messages`;

    const messengerResponse = await fetch(`${apiUrl}?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: aiGeneratedMessage },
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

    const enhancedMetadata = {
      platform: channelType,
      ai_model,
      ai_prompt: ai_prompt || 'Dynamic prompt generated',
      confidence_score: aiResponse.confidence_score || confidence_score,
      facebook_message_id: messengerResult.message_id,
      timestamp: new Date().toISOString(),
      automated_response: true,
      context_messages_count: messageContext.length,
      delay_applied: randomDelay,
      original_user_message: message,
      ai_config_used: {
        goals: aiConfig.goals?.substring(0, 100) || null,
        restrictions: aiConfig.restrictions?.substring(0, 100) || null,
        knowledge_base: aiConfig.knowledge_base?.substring(0, 100) || null
      }
    };

    const { data: savedMessageId, error: messageError } = await supabase
      .rpc('insert_ai_message', {
        p_conversation_id: conversation_id,
        p_content: aiGeneratedMessage,
        p_platform_message_id: messengerResult.message_id,
        p_ai_model: ai_model,
        p_ai_prompt: ai_prompt || 'Dynamic prompt generated',
        p_metadata: enhancedMetadata
      });

    if (messageError) {
      console.error('Error saving AI message to database:', messageError)
      return new Response(
        JSON.stringify({ error: 'Message sent but failed to save locally' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Mensaje generado correctamente:', {
      conversation_id,
      saved_message_id: savedMessageId,
      platform_message_id: messengerResult.message_id,
      ai_model,
      context_used: messageContext.length,
      delay_applied: randomDelay,
      confidence_score: aiResponse.confidence_score
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messengerResult.message_id,
        saved_message_id: savedMessageId,
        conversation_id: conversation_id,
        sender_type: 'ia',
        ai_model,
        context_messages_used: messageContext.length,
        delay_applied: randomDelay,
        confidence_score: aiResponse.confidence_score,
        ai_generated_content: aiGeneratedMessage,
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