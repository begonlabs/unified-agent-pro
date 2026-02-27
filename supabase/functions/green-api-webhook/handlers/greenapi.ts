// green-api-webhook/handlers/greenapi.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Green API Event Handler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';
import { handleAdvisorHandoff } from '../../_shared/advisor.ts';



/**
 * Detect the correct Green API host based on idInstance
 */
function getGreenApiHost(idInstance: string, providedUrl?: string): string {
    const defaultHost = 'https://7107.api.green-api.com';
    const altHost = 'https://7700.api.green-api.com';

    // Si el ID empieza con 77, forzamos 7700 sin importar lo que venga de la DB
    if (idInstance.startsWith('77')) {
        return altHost;
    }

    // Si empieza con 71, forzamos 7107
    if (idInstance.startsWith('71')) {
        return defaultHost;
    }

    // Fallback al URL proveído o al default
    return providedUrl || defaultHost;
}

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
    apiToken: string,
    hostUrl: string = 'https://7107.api.green-api.com'
): Promise<{ success: boolean; messageId?: string; usedUrl?: string }> {
    try {
        // Force correct host based on instance ID for robustness
        const baseHost = getGreenApiHost(idInstance, hostUrl).replace(/\/$/, '');
        const apiUrl = `${baseHost}/waInstance${idInstance}/sendMessage/${apiToken}`;

        console.log('📤 Sending Green API message to:', `${baseHost}/waInstance${idInstance}/sendMessage/REDACTED`);

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
            messageId: result.idMessage,
            usedUrl: baseHost
        };

    } catch (error) {
        console.error('❌ Error in sendAIResponseViaGreenApi:', error);
        return { success: false };
    }
}

/**
 * Get Contact Info (Avatar + Name) from Green API
 */
async function getContactInfo(
    chatId: string,
    idInstance: string,
    apiToken: string,
    hostUrl: string = 'https://7107.api.green-api.com'
): Promise<{ avatar: string | null; name: string | null }> {
    try {
        const baseHost = getGreenApiHost(idInstance, hostUrl).replace(/\/$/, '');
        const apiUrl = `${baseHost}/waInstance${idInstance}/getContactInfo/${apiToken}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId
            })
        });

        if (!response.ok) {
            return { avatar: null, name: null };
        }

        const result = await response.json();
        return {
            avatar: result.avatar || null,
            name: result.name || result.contactName || null // Try public name, then contact book name
        };

    } catch (error) {
        console.error('❌ Error fetching contact info:', error);
        return { avatar: null, name: null };
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

        // 🚫 Block ghost messages with {{SWE001}}
        if (messageText && (messageText === '{{SWE001}}' || messageText.includes('{{SWE001}}'))) {
            console.error('🚫 BLOCKED GHOST MESSAGE:', {
                text: messageText,
                sender: event.senderData?.sender,
                fullEvent: JSON.stringify(event)
            });
            return;
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

        const { data: channels, error: channelError } = await supabase
            .from('communication_channels')
            .select('*')
            .eq('channel_type', 'whatsapp_green_api')
            .eq('channel_config->>idInstance', idInstance)
            .eq('is_connected', true)
            .limit(1);

        if (channelError || !channels || channels.length === 0) {
            console.error('❌ No channel found for idInstance:', idInstance, channelError?.message);
            return;
        }

        const channel = channels[0];

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
            // Get WhatsApp profile info before creating client
            console.log('🔍 Fetching WhatsApp profile info for new client');
            const contactInfo = await getContactInfo(
                senderId,
                idInstance,
                channel.channel_config.apiTokenInstance,
                channel.channel_config.apiUrl
            );

            // Try all possible sources for the name
            const clientName = contactInfo.name ||
                event.senderData?.senderName ||
                event.senderData?.chatName ||
                `WhatsApp User ${senderId.slice(-4)}`;

            // Extract country from phone number
            let country = null;
            try {
                // Remove @s.whatsapp.net or @c.us suffix if present
                const cleanPhone = senderId.replace(/@s\.whatsapp\.net|@c\.us/g, '');
                // Ensure it starts with +
                const phoneWithPlus = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

                // Try to parse the phone number (using a simple regex approach since we can't import libraries in edge functions)
                // Extract country code (1-3 digits after +)
                const countryCodeMatch = phoneWithPlus.match(/^\+(\d{1,3})/);
                if (countryCodeMatch) {
                    const countryCode = countryCodeMatch[1];
                    // Map common country codes to country names
                    const countryMap: Record<string, string> = {
                        '1': 'Estados Unidos',
                        '34': 'España',
                        '52': 'México',
                        '54': 'Argentina',
                        '55': 'Brasil',
                        '56': 'Chile',
                        '57': 'Colombia',
                        '58': 'Venezuela',
                        '51': 'Perú',
                        '53': 'Cuba',
                        '593': 'Ecuador',
                        '595': 'Paraguay',
                        '598': 'Uruguay',
                        '591': 'Bolivia',
                        '507': 'Panamá',
                        '506': 'Costa Rica',
                        '503': 'El Salvador',
                        '502': 'Guatemala',
                        '504': 'Honduras',
                        '505': 'Nicaragua',
                        '44': 'Reino Unido',
                        '33': 'Francia',
                        '49': 'Alemania',
                        '39': 'Italia',
                        '351': 'Portugal'
                    };
                    country = countryMap[countryCode] || null;
                }
            } catch (error) {
                console.error('Error extracting country from phone:', error);
            }

            const { data: newClient, error: clientCreateError } = await supabase
                .from('crm_clients')
                .insert({
                    user_id: channel.user_id,
                    name: clientName,
                    phone: senderId,
                    status: 'lead',
                    source: 'whatsapp',
                    country: country,
                    avatar_url: contactInfo.avatar  // Save avatar immediately for new clients
                })
                .select()
                .single();

            if (clientCreateError || !newClient) {
                console.error('❌ Error creating client:', clientCreateError);
                return;
            }

            client = newClient;
            console.log('✅ Created new client:', client.id, 'with name:', clientName);
        }

        // 🔄 Update Avatar and Name if missing (for existing clients created before this feature)
        // Also update if name looks like an ID (contains @s.whatsapp.net) or is just numbers
        const isDefaultName = client.name.includes('WhatsApp User') ||
            client.name.includes('@s.whatsapp.net') ||
            /^\d+$/.test(client.name);

        if (!client.avatar_url || isDefaultName) {
            console.log('🖼️ Fetching contact info for existing client:', client.id);
            try {
                const contactInfo = await getContactInfo(
                    senderId,
                    idInstance,
                    channel.channel_config.apiTokenInstance,
                    channel.channel_config.apiUrl
                );

                const updates: any = {};

                if (!client.avatar_url && contactInfo.avatar) {
                    console.log('✅ Found avatar URL:', contactInfo.avatar);
                    updates.avatar_url = contactInfo.avatar;
                }

                if (isDefaultName && contactInfo.name) {
                    console.log('✅ Found WhatsApp profile name:', contactInfo.name);
                    updates.name = contactInfo.name;
                }

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('crm_clients')
                        .update(updates)
                        .eq('id', client.id);

                    // Update local client object
                    Object.assign(client, updates);
                    console.log('✅ Updated client info successfully');
                }
            } catch (error) {
                console.error('❌ Error updating client info:', error);
            }
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

        // Update conversation and increment unread_count for client messages
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
                console.log('🔍 Fetching AI config for user:', conversation.user_id);
                const { data: aiConfig, error: aiConfigError } = await supabase
                    .from('ai_configurations')
                    .select('*')
                    .eq('user_id', conversation.user_id)
                    .limit(1)
                    .maybeSingle();

                if (aiConfigError) {
                    console.error('❌ Error fetching AI config:', aiConfigError);
                    return;
                }

                if (!aiConfig) {
                    console.log('⚠️ No AI config found for user:', conversation.user_id);
                    return;
                }

                console.log('🤖 AI Config status:', {
                    is_active: aiConfig.is_active,
                    always_active: aiConfig.always_active,
                    has_operating_hours: !!aiConfig.operating_hours
                });

                if (!shouldAIRespond(messageText, aiConfig)) {
                    console.log('🤖 AI decides not to respond (shouldAIRespond returned false)');
                    return;
                }

                // Check message limits before generating response
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('messages_sent_this_month, messages_limit, is_trial, payment_status')
                    .eq('user_id', conversation.user_id)
                    .single();

                if (profile) {
                    if (!profile.is_trial && profile.payment_status === 'active') {
                        const sent = profile.messages_sent_this_month || 0;
                        const limit = profile.messages_limit || 0;

                        if (sent >= limit) {
                            console.log('🚫 AI response blocked: Message limit reached', { sent, limit });
                            return;
                        }
                    } else if (!profile.is_trial && profile.payment_status !== 'active') {
                        console.log('🚫 AI response blocked: Subscription inactive');
                        return;
                    }
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

                // Generate AI response with client name for personalization
                const aiResponse = await generateAIResponse(
                    messageText,
                    aiConfig,
                    conversationHistory,
                    channel.user_id,
                    client.name  // Pass client name for personalized responses
                );

                if (aiResponse.success && aiResponse.response) {
                    console.log('🤖 AI response generated successfully');

                    // Check for advisor handoff
                    if (aiResponse.advisor_triggered) {
                        await handleAdvisorHandoff({
                            supabase,
                            conversation_id: conversation.id,
                            user_id: conversation.user_id,
                            platform: 'whatsapp_green_api',
                            client_id: client.id
                        });
                    }

                    // Send via Green API
                    const sendResult = await sendAIResponseViaGreenApi(
                        aiResponse.response,
                        chatId,
                        idInstance,
                        channel.channel_config.apiTokenInstance,
                        channel.channel_config.apiUrl
                    );

                    // Guardar mensaje de la IA (independientemente del resultado del envío para diagnóstico)
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
                                green_api_message_id: sendResult.messageId,
                                sent_successfully: sendResult.success,
                                error: !sendResult.success ? 'Failed to send via Green API' : null,
                                api_url: channel.channel_config.apiUrl
                            }
                        });

                    if (aiMessageError) {
                        console.error('❌ Error saving AI message:', aiMessageError);
                    } else {
                        console.log(sendResult.success ? '✅ AI response sent and saved successfully' : '⚠️ AI message saved but NOT sent (check logs)');

                        // Increment message count for AI response using RPC
                        if (sendResult.success) {
                            const { error: rpcError } = await supabase.rpc('increment_message_usage', {
                                user_id_param: conversation.user_id
                            });

                            if (rpcError) {
                                console.error('❌ Error incrementing message count via RPC:', rpcError);

                                // Fallback: Fetch fresh profile and update manually
                                try {
                                    const { data: freshProfile } = await supabase
                                        .from('profiles')
                                        .select('messages_sent_this_month')
                                        .eq('user_id', conversation.user_id)
                                        .single();

                                    if (freshProfile) {
                                        const { error: updateError } = await supabase
                                            .from('profiles')
                                            .update({ messages_sent_this_month: (freshProfile.messages_sent_this_month || 0) + 1 })
                                            .eq('user_id', conversation.user_id);

                                        if (updateError) {
                                            console.error('❌ Error in fallback update:', updateError);
                                        } else {
                                            console.log('✅ Message count incremented via fallback manual update');
                                        }
                                    }
                                } catch (fallbackError) {
                                    console.error('❌ Critical error in fallback update logic:', fallbackError);
                                }
                            } else {
                                console.log('✅ Message count incremented via RPC');
                            }
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
