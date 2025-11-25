// green-api-webhook/handlers/greenapi.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Green API Event Handler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';

interface GreenApiEvent {
    typeWebhook?: string;
    instanceData?: {
        idInstance: number;
        wid: string;
    };
    timestamp?: number;
    idMessage?: string;
    senderData?: {
        chatId: string;
        chatName?: string;
        sender: string;
        senderName?: string;
    };
    messageData?: {
        typeMessage?: string;
        textMessageData?: {
            textMessage: string;
        };
        extendedTextMessageData?: {
            text?: string;
            description?: string;
        };
    };
}

/**
 * Send AI response via Green API
 */
async function sendAIResponseViaGreenApi(
    message: string,
    chatId: string,
    idInstance: string,
    apiToken: string
): Promise<{ success: boolean; messageId?: string }> {
    try {
        const apiUrl = `https://7107.api.green-api.com/waInstance${idInstance}/sendMessage/${apiToken}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId,
                message: message
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Error sending message via Green API:', response.status, errorData);
            return { success: false };
        }

        const result = await response.json();
        console.log('✅ Message sent via Green API:', result.idMessage);
        return {
            success: true,
            messageId: result.idMessage
        };

    } catch (error) {
        console.error('❌ Error in sendAIResponseViaGreenApi:', error);
        return { success: false };
    }
}

export async function handleGreenApiEvent(event: GreenApiEvent): Promise<void> {
    try {
        console.log('🎯 Processing Green API event');

        // Extract message text
        let messageText: string | undefined;
        if (event.messageData?.textMessageData?.textMessage) {
            messageText = event.messageData.textMessageData.textMessage;
        } else if (event.messageData?.extendedTextMessageData?.text) {
            messageText = event.messageData.extendedTextMessageData.text;
        }

        const idInstance = event.instanceData?.idInstance?.toString();
        const senderId = event.senderData?.sender;
        const chatId = event.senderData?.chatId;
        const messageId = event.idMessage;

        if (!messageText || !idInstance || !chatId) {
            console.log('⚠️ Missing required fields:', {
                messageText: !!messageText,
                idInstance: !!idInstance,
                chatId: !!chatId
            });
            return;
        }

        console.log('📝 Event details:', {
            messageText,
            idInstance,
            chatId,
            senderId,
            messageId
        });

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Missing Supabase environment variables');
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check for duplicate messages
        if (messageId) {
            const { data: existingMessage } = await supabase
                .from('messages')
                .select('id')
                .eq('platform_message_id', messageId)
                .limit(1)
                .single();

            if (existingMessage) {
                console.log('⏭️ Skipping - message already processed:', messageId);
                return;
            }
        }

        // Find channel by idInstance
        console.log('🔍 Looking for channel with idInstance:', idInstance);

        const { data: channel, error: channelError } = await supabase
            .from('communication_channels')
            .select('*')
            .eq('channel_type', 'whatsapp_green_api')
            .eq('channel_config->>idInstance', idInstance)
            .eq('is_connected', true)
            .single();

        if (channelError || !channel) {
            console.error('❌ No channel found for idInstance:', idInstance, channelError?.message);
            return;
        }

        console.log('✅ Found channel:', { id: channel.id, user_id: channel.user_id });

        // Find or create client
        let client;
        const { data: existingClient } = await supabase
            .from('crm_clients')
            .select('*')
            .eq('user_id', channel.user_id)
            .eq('phone', senderId)
            .single();

        if (existingClient) {
            client = existingClient;
            console.log('✅ Found existing client:', client.id);
        } else {
            const clientName = event.senderData?.senderName || `WhatsApp User ${senderId.slice(-4)}`;

            const { data: newClient, error: clientCreateError } = await supabase
                .from('crm_clients')
                .insert({
                    user_id: channel.user_id,
                    name: clientName,
                    phone: senderId,
                    status: 'active',
                    source: 'whatsapp_green_api'
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
        let conversation;
        const { data: existingConv } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', channel.user_id)
            .eq('client_id', client.id)
            .eq('channel', 'whatsapp')
            .eq('channel_thread_id', chatId)
            .single();

        if (existingConv) {
            conversation = existingConv;
            console.log('✅ Found existing conversation:', conversation.id);
        } else {
            const { data: newConv, error: convCreateError } = await supabase
                .from('conversations')
                .insert({
                    user_id: channel.user_id,
                    client_id: client.id,
                    channel: 'whatsapp',
                    channel_thread_id: chatId,
                    status: 'open',
                    last_message_at: new Date().toISOString(),
                    ai_enabled: true
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

        // Save message
        const messageData = {
            conversation_id: conversation.id,
            content: messageText,
            sender_type: 'client',
            is_automated: false,
            sender_name: client.name,
            platform_message_id: messageId,
            metadata: {
                platform: 'whatsapp_green_api',
                idInstance,
                chatId,
                senderId,
                timestamp: event.timestamp
            }
        };

        const { error: messageError } = await supabase
            .from('messages')
            .insert(messageData);

        if (messageError) {
            console.error('❌ Error saving message:', messageError);
            return;
        }

        // Update conversation
        await supabase
            .from('conversations')
            .update({
                last_message_at: new Date().toISOString(),
                status: 'open'
            })
            .eq('id', conversation.id);

        console.log('✅ Message saved successfully');

        // Generate AI response
        if (conversation.ai_enabled) {
            try {
                console.log('🤖 Generating AI response for conversation:', conversation.id);

                // Check for recent AI response
                const { data: recentAI, count: recentAICount } = await supabase
                    .from('messages')
                    .select('id', { count: 'exact' })
                    .eq('conversation_id', conversation.id)
                    .eq('sender_type', 'ia')
                    .gte('created_at', new Date(Date.now() - 5000).toISOString())
                    .limit(1);

                if (recentAICount && recentAICount > 0) {
                    console.log('⏭️ Skipping AI response - IA responded recently');
                    return;
                }

                // Get AI config
                const { data: aiConfig } = await supabase
                    .from('ai_configurations')
                    .select('*')
                    .eq('user_id', conversation.user_id)
                    .single();

                if (!aiConfig) {
                    console.log('⚠️ No AI config found for user:', conversation.user_id);
                    return;
                }

                if (!shouldAIRespond(messageText, aiConfig)) {
                    console.log('🤖 AI decides not to respond');
                    return;
                }

                // Get conversation history
                const { data: recentMessages } = await supabase
                    .from('messages')
                    .select('id, content, sender_type, sender_name, created_at')
                    .eq('conversation_id', conversation.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                const conversationHistory = recentMessages?.reverse().map(msg => ({
                    id: msg.id,
                    content: msg.content,
                    sender_type: msg.sender_type === 'ia' ? 'ia' : 'user',
                    sender_name: msg.sender_name || 'Usuario',
                    created_at: msg.created_at,
                    metadata: {}
                })) || [];

                console.log('📜 Loaded conversation history:', conversationHistory.length);

                // Generate AI response
                const aiResponse = await generateAIResponse(messageText, aiConfig, conversationHistory);

                if (aiResponse.success && aiResponse.response) {
                    console.log('🤖 AI response generated successfully');

                    // Send via Green API
                    const sendResult = await sendAIResponseViaGreenApi(
                        aiResponse.response,
                        chatId,
                        idInstance,
                        channel.channel_config.apiTokenInstance
                    );

                    if (sendResult.success) {
                        // Save AI message
                        const { error: aiMessageError } = await supabase
                            .from('messages')
                            .insert({
                                conversation_id: conversation.id,
                                content: aiResponse.response,
                                sender_type: 'ia',
                                sender_name: 'IA Assistant',
                                is_automated: true,
                                platform_message_id: sendResult.messageId || `ai_${Date.now()}`,
                                metadata: {
                                    confidence_score: aiResponse.confidence_score,
                                    ai_model: 'gpt-4o-mini',
                                    platform: 'whatsapp_green_api',
                                    green_api_message_id: sendResult.messageId
                                }
                            });

                        if (aiMessageError) {
                            console.error('❌ Error saving AI message:', aiMessageError);
                        } else {
                            console.log('✅ AI response sent and saved successfully');
                        }
                    }
                }

            } catch (error) {
                console.error('❌ Error in AI process:', error);
            }
        }

    } catch (error) {
        console.error('Critical error in handleGreenApiEvent:', error);
    }
}
