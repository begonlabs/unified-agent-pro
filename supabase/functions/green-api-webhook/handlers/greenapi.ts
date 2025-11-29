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
        fileMessageData?: {
            downloadUrl: string;
            caption?: string;
            fileName?: string;
            mimeType?: string;
            jpegThumbnail?: string;
        };
    };
}

// ... (keep existing helper functions) ...

export async function handleGreenApiEvent(event: GreenApiEvent): Promise<void> {
    try {
        console.log('🎯 Processing Green API event');

        // Extract message text and media info
        let messageText: string | undefined;
        let mediaUrl: string | undefined;
        let mediaType: 'image' | 'audio' | 'video' | 'document' | undefined;
        let mediaCaption: string | undefined;
        let fileName: string | undefined;
        let mimeType: string | undefined;

        const typeMessage = event.messageData?.typeMessage;

        if (typeMessage === 'textMessage' && event.messageData?.textMessageData?.textMessage) {
            messageText = event.messageData.textMessageData.textMessage;
        } else if (typeMessage === 'extendedTextMessage' && event.messageData?.extendedTextMessageData?.text) {
            messageText = event.messageData.extendedTextMessageData.text;
        } else if (['imageMessage', 'videoMessage', 'documentMessage', 'audioMessage', 'voiceMessage'].includes(typeMessage || '')) {
            // Handle media messages
            const fileData = event.messageData?.fileMessageData;
            if (fileData?.downloadUrl) {
                mediaUrl = fileData.downloadUrl;
                mediaCaption = fileData.caption;
                fileName = fileData.fileName;
                mimeType = fileData.mimeType;

                // Determine media type
                if (typeMessage === 'imageMessage') mediaType = 'image';
                else if (typeMessage === 'audioMessage' || typeMessage === 'voiceMessage') mediaType = 'audio';
                else if (typeMessage === 'videoMessage') mediaType = 'video';
                else mediaType = 'document';

                // Set fallback text for content
                messageText = mediaCaption || (
                    mediaType === 'image' ? '📷 Imagen' :
                        mediaType === 'audio' ? '🎵 Audio' :
                            mediaType === 'video' ? '🎥 Video' :
                                `📄 Archivo: ${fileName || 'Documento'}`
                );
            }
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
            mediaType,
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
            // Get WhatsApp profile info before creating client
            console.log('🔍 Fetching WhatsApp profile info for new client');
            const contactInfo = await getContactInfo(
                senderId,
                idInstance,
                channel.channel_config.apiTokenInstance
            );

            // Try all possible sources for the name
            const clientName = contactInfo.name ||
                event.senderData?.senderName ||
                event.senderData?.chatName ||
                `WhatsApp User ${senderId.slice(-4)}`;

            const { data: newClient, error: clientCreateError } = await supabase
                .from('crm_clients')
                .insert({
                    user_id: channel.user_id,
                    name: clientName,
                    phone: senderId,
                    status: 'active',
                    source: 'whatsapp_green_api',
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
        if (!client.avatar_url || client.name.includes('WhatsApp User')) {
            console.log('🖼️ Fetching contact info for existing client:', client.id);
            try {
                const contactInfo = await getContactInfo(
                    senderId,
                    idInstance,
                    channel.channel_config.apiTokenInstance
                );

                const updates: any = {};

                if (!client.avatar_url && contactInfo.avatar) {
                    console.log('✅ Found avatar URL:', contactInfo.avatar);
                    updates.avatar_url = contactInfo.avatar;
                }

                if (client.name.includes('WhatsApp User') && contactInfo.name) {
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
                timestamp: event.timestamp,
                // Media info
                file_url: mediaUrl,
                file_type: mediaType,
                file_name: fileName,
                file_caption: mediaCaption,
                mime_type: mimeType
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
                    .limit(1)
                    .maybeSingle();

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
