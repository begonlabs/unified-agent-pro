import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  conversationId: string;
  message: string;
  clientId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from request
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { conversationId, message, clientId }: AIRequest = await req.json();

    // Get AI configuration for this user
    const { data: aiConfig, error: configError } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError) {
      console.log('No AI config found, using defaults');
    }

    // Get conversation context
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        crm_clients (name, email, phone, status, tags)
      `)
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build context for AI
    const clientInfo = conversation.crm_clients 
      ? `Cliente: ${conversation.crm_clients.name}${conversation.crm_clients.email ? ` (${conversation.crm_clients.email})` : ''}`
      : 'Cliente anónimo';

    const messageHistory = recentMessages?.reverse().map(msg => 
      `${msg.sender_type === 'client' ? 'Cliente' : 'Asistente'}: ${msg.content}`
    ).join('\n') || '';

    // Build context for AI using the published prompt
    let contextMessage = `INFORMACIÓN DEL CLIENTE:
${clientInfo}

CANAL: ${conversation.channel}`;

    if (aiConfig) {
      if (aiConfig.goals) {
        contextMessage += `\n\nOBJETIVOS ESPECÍFICOS DE LA EMPRESA:
${aiConfig.goals}`;
      }

      if (aiConfig.restrictions) {
        contextMessage += `\n\nRESTRICCIONES ESPECÍFICAS:
${aiConfig.restrictions}`;
      }

      if (aiConfig.knowledge_base) {
        contextMessage += `\n\nBASE DE CONOCIMIENTO DE LA EMPRESA:
${aiConfig.knowledge_base}`;
      }

      if (aiConfig.faq) {
        contextMessage += `\n\nPREGUNTAS FRECUENTES DE LA EMPRESA:
${aiConfig.faq}`;
      }
    }

    if (messageHistory) {
      contextMessage += `\n\nCONVERSACIÓN RECIENTE:
${messageHistory}`;
    }

    contextMessage += `\n\nCONSULTA ACTUAL: ${message}`;

    // Call OpenAI API using the published prompt
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: contextMessage }
        ],
        prompt: {
          id: "pmpt_686e04aaad78819682d3089f011531b606b73c746fad9261",
          version: "2"
        },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const aiData = await openAIResponse.json();
    const aiReply = aiData.choices[0].message.content;

    // Save user message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: message,
        sender_type: 'client',
        is_automated: false,
      });

    // Save AI response
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: aiReply,
        sender_type: 'human',
        sender_name: 'IA Assistant',
        is_automated: true,
      });

    // Update conversation last message time
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log(`AI response generated for conversation ${conversationId}`);

    return new Response(JSON.stringify({ 
      response: aiReply,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});