// meta-webhook/handlers/instagram.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// supabase-project/volumes/meta-webhook/handlers/instagram.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateAIResponse, shouldAIRespond } from '../../_shared/openai.ts';
import { handleAdvisorHandoff } from '../../_shared/advisor.ts';

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

// interface for Instagram channel configuration
interface InstagramChannelConfig {
  instagram_user_id: string;
  instagram_business_account_id?: string; // Business Account ID for messaging
  username: string;
  access_token: string;
  account_type: string;
  token_type?: string;
  expires_at?: string;
  connected_at?: string;
  messaging_available?: boolean;
  webhook_subscribed?: boolean;
  verified_at?: string;
}

// interface for communication channel
interface CommunicationChannel {
  id: string;
  user_id: string;
  channel_type: string;
  is_connected: boolean;
  channel_config: InstagramChannelConfig;
  created_at?: string;
  updated_at?: string;
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
 * Get Instagram user profile (username and profile picture)
 * @param userId - Instagram user IGSID (not business account ID)
 * @param pageAccessToken - Page access token (not user access token)
 * @returns Promise with name and avatar_url
 */
async function getInstagramUserProfile(
  userId: string,
  pageAccessToken: string
): Promise<{ name: string; avatar_url?: string }> {
  try {
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v21.0';
    // IMPORTANT: Use 'name', 'username' and 'profile_pic' fields for Instagram
    // 'name' returns the full name (e.g., "Sarkis Panosian")
    // 'username' returns the Instagram handle (e.g., "ernesto_grz")
    // 'profile_pic' returns the profile picture URL
    const url = `https://graph.facebook.com/${graphVersion}/${userId}?fields=name,username,profile_pic&access_token=${pageAccessToken}`;
 
    console.log('🔍 Fetching Instagram profile via Facebook Graph API:', { userId, graphVersion });
 
    const response = await fetch(url);
 
    if (!response.ok) {
       const errorText = await response.text();
       console.error('❌ Error fetching Instagram profile:', {
         status: response.status,
         error: errorText,
         userId,
         endpoint: 'Facebook Graph API'
       });
       // Fallback with generic name
       return {
         name: `Instagram User ${userId.slice(-4)}`,
         avatar_url: `https://graph.facebook.com/${userId}/picture?type=large`
       };
    }
 
    const data = await response.json();
    console.log('✅ Instagram profile data received:', JSON.stringify(data));
 
    // Prioritize 'name' (Full Name) over 'username'
    const displayName = data.name || (data.username ? (data.username.startsWith('@') ? data.username : `@${data.username}`) : `Instagram User ${userId.slice(-4)}`);
    const avatarUrl = data.profile_pic || `https://graph.facebook.com/${userId}/picture?type=large`;
 
    return {
      name: displayName,
      avatar_url: avatarUrl
    };
  } catch (error) {
    console.error('❌ Error in getInstagramUserProfile:', error);
    // Fallback on error with picture URL
    return {
      name: `Instagram User ${userId.slice(-4)}`,
      avatar_url: `https://graph.facebook.com/${userId}/picture?type=large`
    };
  }
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
      message_text: event.message?.text,
      message_mid: event.message?.mid,
      is_echo: event.message?.is_echo,
      sender_id: event.sender?.id,
      recipient_id: event.recipient?.id,
      timestamp: event.timestamp,
      full_event: JSON.stringify(event, null, 2)
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

    // 🔥 CRITICAL: Check if this message was already processed (prevent duplicates)
    if (messageId) {
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id, created_at')
        .eq('platform_message_id', messageId)
        .limit(1)
        .single();

      if (existingMessage) {
        console.log('⏭️ Skipping Instagram message - already processed:', {
          platform_message_id: messageId,
          existing_message_id: existingMessage.id,
          created_at: existingMessage.created_at,
          duplicate_prevention: 'Meta webhook duplicate detected'
        });
        return; // Exit early - message already processed
      }
    }



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

    // 🔥 ENHANCED: Try multiple search strategies for Instagram channels
    let channel: CommunicationChannel | null = null;
    let channelError: unknown = null;

    console.log('🔍 Starting comprehensive Instagram channel search...');

    // Strategy 1: Search by Instagram Business Account ID (new field)
    console.log('📋 Strategy 1: Searching by Business Account ID:', webhookBusinessId);
    const { data: businessChannel, error: businessError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('channel_config->>instagram_business_account_id', webhookBusinessId)
      .in('channel_type', ['instagram', 'instagram_legacy'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (businessChannel && !businessError) {
      channel = businessChannel;
      console.log('✅ Found Instagram channel by Business Account ID:', businessChannel.id);
    } else {
      console.log('❌ Strategy 1 failed:', businessError?.message || 'No business channel found');

      // Strategy 2: Search by Instagram User ID (old field, for backwards compatibility)  
      console.log('📋 Strategy 2: Searching by User ID:', webhookBusinessId);
      const { data: userChannel, error: userError } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('channel_config->>instagram_user_id', webhookBusinessId)
        .in('channel_type', ['instagram', 'instagram_legacy'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (userChannel && !userError) {
        channel = userChannel;
        console.log('✅ Found Instagram channel by User ID (fallback):', userChannel.id);
      } else {
        console.log('❌ Strategy 2 failed:', userError?.message || 'No user channel found');

        // Strategy 3: Search ALL Instagram channels to debug
        console.log('📋 Strategy 3: Debugging - Getting ALL Instagram channels...');
        const { data: allChannels, error: allError } = await supabase
          .from('communication_channels')
          .select('id, user_id, channel_config, is_connected')
          .in('channel_type', ['instagram', 'instagram_legacy']);

        if (allChannels && !allError) {
          console.log('🔍 All Instagram channels found:', allChannels.length);
          allChannels.forEach((ch, index) => {
            const config = ch.channel_config as InstagramChannelConfig;
            console.log(`  Channel ${index + 1}:`, {
              id: ch.id,
              user_id: ch.user_id,
              is_connected: ch.is_connected,
              instagram_user_id: config?.instagram_user_id,
              instagram_business_account_id: config?.instagram_business_account_id,
              username: config?.username,
              account_type: config?.account_type,
              messaging_available: config?.messaging_available
            });
          });

          // Strategy 4: Try to find by any matching ID in the config
          console.log('📋 Strategy 4: Searching by ANY matching ID in config...');
          const matchingChannel = allChannels.find(ch => {
            const config = ch.channel_config as InstagramChannelConfig;
            // Also check page_id if available (it might match webhookBusinessId in some edge cases)
            return config?.instagram_user_id === webhookBusinessId ||
              config?.instagram_business_account_id === webhookBusinessId ||
              (config as any)?.page_id === webhookBusinessId;
          });

          if (matchingChannel) {
            channel = matchingChannel;
            console.log('✅ Found Instagram channel by config matching:', matchingChannel.id);
          } else {
            channelError = new Error('No Instagram channel found with any matching ID');
            console.log('❌ Strategy 4 failed: No matching channel found');
          }
        } else {
          channelError = allError || new Error('Failed to fetch Instagram channels');
          console.log('❌ Strategy 3 failed:', allError?.message);
        }
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

    const { data: existingClientById, error: idSearchError } = await supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('metadata->>instagram_id', realUserId)
      .single();

    let existingClient = existingClientById;

    // Fallback: search by phone (legacy behavior)
    if (!existingClient) {
      const { data: existingClientByPhone, error: phoneSearchError } = await supabase
        .from('crm_clients')
        .select('*')
        .eq('user_id', channel.user_id)
        .eq('phone', realUserId)
        .single();

      existingClient = existingClientByPhone;
    }

    // Fetch profile info if needed (new client or missing info)
    let profileInfo = { name: `Instagram User ${realUserId.slice(-4)}`, avatar_url: undefined };

    // Diagnostic logging for profile fetching
    console.log('🔍 Instagram profile fetch attempt:', {
      hasPageToken: !!channel.channel_config.page_access_token,
      tokenPreview: channel.channel_config.page_access_token ? `${channel.channel_config.page_access_token.substring(0, 10)}...` : 'MISSING',
      realUserId,
      channelId: channel.id
    });

    // IMPORTANT: Use page_access_token to fetch Instagram user profiles
    if (channel.channel_config.page_access_token) {
      console.log('📞 Calling getInstagramUserProfile with page token...');
      profileInfo = await getInstagramUserProfile(realUserId, channel.channel_config.page_access_token);
      console.log('✅ Instagram profile fetch result:', profileInfo);
    } else {
      console.warn('⚠️ Skipping Instagram profile fetch: access_token is missing from channel_config');
    }

    if (existingClient) {
      client = existingClient;
      console.log('✅ Found existing client:', client.id);

      // Update metadata with Instagram ID if missing (migration path)
      const currentMetadata = client.metadata || {};
      let needsUpdate = false;
      const updateData: any = {};

      if (!currentMetadata.instagram_id) {
        console.log('🔄 Adding instagram_id to client metadata');
        updateData.metadata = { ...currentMetadata, instagram_id: realUserId };
        needsUpdate = true;
      }

      // Update client info if name is generic or avatar is missing
      const shouldUpdateProfile = (
        (!client.name || client.name.startsWith('Instagram User')) ||
        !client.avatar_url
      );

      if (shouldUpdateProfile && profileInfo) {
        console.log('📝 Updating Instagram client with fresh profile data:', {
          client_id: client.id,
          old_name: client.name,
          new_name: profileInfo.name,
          has_avatar: !!profileInfo.avatar_url
        });
        updateData.name = profileInfo.name;
        updateData.avatar_url = profileInfo.avatar_url || client.avatar_url;
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Preserve existing metadata if we're updating it
        if (updateData.metadata) {
          updateData.metadata = { ...currentMetadata, ...updateData.metadata };
        }

        const { error: updateError } = await supabase
          .from('crm_clients')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id);

        if (!updateError) {
          if (updateData.name) client.name = updateData.name;
          if (updateData.avatar_url) client.avatar_url = updateData.avatar_url;
          console.log('✅ Instagram client updated with new data');
        } else {
          console.error('❌ Failed to update Instagram client:', updateError);
        }
      }

    } else {
      // Check client limit before creating new client
      const { data: profile } = await supabase
        .from('profiles')
        .select('clients_limit, is_trial')
        .eq('user_id', channel.user_id)
        .single();

      if (profile && !profile.is_trial) {
        const { count } = await supabase
          .from('crm_clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', channel.user_id);

        const currentCount = count || 0;
        const limit = profile.clients_limit || 0;

        if (currentCount >= limit) {
          console.log(`❌ Client limit reached (${currentCount}/${limit}). Skipping new client creation.`);
          return;
        }
      }

      // Create new client with profile info
      const { data: newClient, error: clientCreateError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: profileInfo.name,
          phone: realUserId,
          avatar_url: profileInfo.avatar_url,
          status: 'lead',
          source: 'instagram',
          metadata: {
            instagram_id: realUserId
          }
        })
        .select()
        .single();

      if (clientCreateError || !newClient) {
        console.error('❌ Error creating client:', clientCreateError);
        return;
      }

      client = newClient;
      console.log('✅ Created new Instagram client with profile data:', {
        id: client.id,
        name: client.name,
        has_avatar: !!client.avatar_url
      });
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

    // Update conversation last_message_at and increment unread_count for client messages only
    if (senderType === 'client') {
      // Client message - increment unread_count
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
    } else {
      // Agent/echo message - don't increment unread_count
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          status: 'open'
        })
        .eq('id', conversation.id);
    }

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
            console.log('⏭️ Skipping AI response - already responded to this specific Instagram message:', {
              client_message_id: clientMessage.id,
              existing_ai_response_id: existingAIResponse.id
            });
            return;
          }
        }

        let { data: aiConfig } = await supabase
          .from('ai_configurations')
          .select('*')
          .eq('user_id', conversation.user_id)
          .limit(1)
          .maybeSingle();

        if (!aiConfig) {
          console.log('⚠️ No se encontró configuración de IA para el usuario, usando valores por defecto:', conversation.user_id);
          aiConfig = {
            is_active: true,
            always_active: true,
            goals: 'Eres un asistente amable y profesional.',
            restrictions: 'No des información falsa.',
            response_time: 30
          };
        }

        // Verificar si la IA debe responder a este mensaje
        if (!shouldAIRespond(text, aiConfig)) {
          console.log('🤖 IA decide no responder a este mensaje de Instagram');
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

          // Check for advisor handoff
          if (aiResponse.advisor_triggered) {
            await handleAdvisorHandoff({
              supabase,
              conversation_id: conversation.id,
              platform: 'instagram',
              client_id: client.id
            });
          }

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
          } else {
            console.log('✅ Respuesta de IA enviada y guardada exitosamente');

            // Increment message count for AI response
            // Increment message count for AI response using RPC
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
                } else {
                  console.error('❌ Could not fetch profile for fallback update');
                }
              } catch (fallbackError) {
                console.error('❌ Critical error in fallback update logic:', fallbackError);
              }
            } else {
              console.log('✅ Message count incremented via RPC');
            }
          }
          // Enviar mensaje automático de IA por Instagram Messaging API
          try {
            // IMPORTANT: Use page_access_token and page_id (same as send-ai-message function)
            const accessToken = channel.channel_config.page_access_token;
            const pageId = channel.channel_config.page_id;
            const igUserId = realUserId; // El ID del usuario de Instagram

            console.log('📤 Enviando mensaje de IA por Instagram a:', igUserId);
            console.log('🔑 Using page access token:', accessToken ? 'Present' : 'Missing');
            console.log('📄 Using page ID:', pageId);

            // Use Facebook Graph API v24.0 with page ID (not the old Instagram Graph API)
            const apiUrl = `https://graph.facebook.com/v24.0/${pageId}/messages`;

            const instagramApiResponse = await fetch(
              `${apiUrl}?access_token=${accessToken}`,
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
              const errorDataText = await instagramApiResponse.text();
              console.error('❌ Error enviando mensaje por Instagram API:', errorDataText);
              try {
                const errorData = JSON.parse(errorDataText);
                if (errorData.error && (errorData.error.code === 190 || errorData.error.type === 'OAuthException')) {
                  console.error(`🔌 Instagram token expired for channel ${channel.id}. Disconnecting channel in DB.`);
                  await supabase
                    .from('communication_channels')
                    .update({ is_connected: false })
                    .eq('id', channel.id);
                  
                  // Broadcast disconnection event for real-time UI updates
                  const realtimeChannel = supabase.channel('channel_notifications');
                  await realtimeChannel.send({
                    type: 'broadcast',
                    event: 'channel_disconnected',
                    payload: { 
                      userId: channel.user_id,
                      channelType: 'instagram',
                      channelId: channel.id
                    },
                  });
                  console.log(`📡 Broadcasted Instagram disconnection for user ${channel.user_id}`);
                }
              } catch (e) {
                console.error('Failed to parse Instagram error response:', e);
              }
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