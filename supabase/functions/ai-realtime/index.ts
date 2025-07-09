import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    let aiConfig: any = null;

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({ 
        type: 'connection_established',
        message: 'Conectado al asistente IA' 
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data.type);

        switch (data.type) {
          case 'auth':
            // Authenticate user
            try {
              const { data: { user }, error: authError } = await supabase.auth.getUser(data.token);
              if (authError || !user) {
                socket.send(JSON.stringify({ 
                  type: 'error', 
                  error: 'Authentication failed' 
                }));
                return;
              }
              
              userId = user.id;
              
              // Load AI configuration
              const { data: config } = await supabase
                .from('ai_configurations')
                .select('*')
                .eq('user_id', userId)
                .single();
              
              aiConfig = config;
              
              socket.send(JSON.stringify({ 
                type: 'authenticated',
                message: 'Usuario autenticado correctamente' 
              }));
            } catch (error) {
              socket.send(JSON.stringify({ 
                type: 'error', 
                error: 'Error en autenticación' 
              }));
            }
            break;

          case 'message':
            if (!userId) {
              socket.send(JSON.stringify({ 
                type: 'error', 
                error: 'Usuario no autenticado' 
              }));
              return;
            }

            const { conversationId, message, clientId } = data;

            // Get conversation context
            const { data: conversation } = await supabase
              .from('conversations')
              .select(`
                *,
                crm_clients (name, email, phone, status, tags)
              `)
              .eq('id', conversationId)
              .eq('user_id', userId)
              .single();

            if (!conversation) {
              socket.send(JSON.stringify({ 
                type: 'error', 
                error: 'Conversación no encontrada' 
              }));
              return;
            }

            // Get recent messages for context
            const { data: recentMessages } = await supabase
              .from('messages')
              .select('content, sender_type, created_at')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: false })
              .limit(10);

            // Build AI context
            const clientInfo = conversation.crm_clients 
              ? `Cliente: ${conversation.crm_clients.name}${conversation.crm_clients.email ? ` (${conversation.crm_clients.email})` : ''}`
              : 'Cliente anónimo';

            const messageHistory = recentMessages?.reverse().map(msg => 
              `${msg.sender_type === 'client' ? 'Cliente' : 'Asistente'}: ${msg.content}`
            ).join('\n') || '';

            let systemPrompt = `Eres un asistente de IA para una empresa. Tu objetivo es ayudar a los clientes de manera profesional y eficiente.

INFORMACIÓN DEL CLIENTE:
${clientInfo}

CANAL: ${conversation.channel}`;

            if (aiConfig) {
              if (aiConfig.goals) {
                systemPrompt += `\n\nOBJETIVOS:
${aiConfig.goals}`;
              }

              if (aiConfig.restrictions) {
                systemPrompt += `\n\nRESTRICCIONES:
${aiConfig.restrictions}`;
              }

              if (aiConfig.knowledge_base) {
                systemPrompt += `\n\nBASE DE CONOCIMIENTO:
${aiConfig.knowledge_base}`;
              }

              if (aiConfig.faq) {
                systemPrompt += `\n\nPREGUNTAS FRECUENTES:
${aiConfig.faq}`;
              }
            }

            systemPrompt += `\n\nCONVERSACIÓN RECIENTE:
${messageHistory}

Responde de manera natural, útil y profesional. Mantén un tono amigable pero profesional.`;

            // Send typing indicator
            socket.send(JSON.stringify({ 
              type: 'typing_start',
              conversationId 
            }));

            // Call OpenAI API with streaming
            const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500,
                stream: true,
              }),
            });

            if (!openAIResponse.ok) {
              socket.send(JSON.stringify({ 
                type: 'error', 
                error: 'Error en la API de OpenAI' 
              }));
              return;
            }

            // Save user message
            await supabase
              .from('messages')
              .insert({
                conversation_id: conversationId,
                content: message,
                sender_type: 'client',
                is_automated: false,
              });

            // Process streaming response
            const reader = openAIResponse.body?.getReader();
            let fullResponse = '';

            if (reader) {
              const decoder = new TextDecoder();
              
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  const chunk = decoder.decode(value);
                  const lines = chunk.split('\n');

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      if (data === '[DONE]') continue;

                      try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        
                        if (content) {
                          fullResponse += content;
                          // Send streaming chunk to client
                          socket.send(JSON.stringify({
                            type: 'ai_chunk',
                            content,
                            conversationId
                          }));
                        }
                      } catch (e) {
                        // Skip invalid JSON lines
                      }
                    }
                  }
                }
              } finally {
                reader.releaseLock();
              }
            }

            // Send completion signal
            socket.send(JSON.stringify({ 
              type: 'typing_end',
              conversationId 
            }));

            // Save complete AI response
            if (fullResponse) {
              await supabase
                .from('messages')
                .insert({
                  conversation_id: conversationId,
                  content: fullResponse,
                  sender_type: 'human',
                  sender_name: 'IA Assistant',
                  is_automated: true,
                });

              // Update conversation
              await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);

              socket.send(JSON.stringify({
                type: 'ai_complete',
                response: fullResponse,
                conversationId
              }));
            }

            break;

          default:
            socket.send(JSON.stringify({ 
              type: 'error', 
              error: 'Tipo de mensaje desconocido' 
            }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          error: 'Error interno del servidor' 
        }));
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return response;

  } catch (error) {
    console.error('Error setting up WebSocket:', error);
    return new Response('WebSocket setup failed', { status: 500 });
  }
});