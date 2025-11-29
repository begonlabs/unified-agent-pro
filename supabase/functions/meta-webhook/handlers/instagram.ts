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

// interface for Instagram verification record
interface InstagramVerificationRecord {
  id: string;
  user_id: string;
  channel_id: string;
  verification_code: string;
  status: 'pending' | 'completed' | 'expired';
  business_account_id?: string;
  sender_id?: string;
  message_content?: string;
  verified_at?: string;
  expires_at: string;
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
 * Checks if a message contains a valid Instagram verification code
 * @param text - Message text to check
 * @returns The verification code if found, null otherwise
 */
function extractVerificationCode(text: string): string | null {
  // Updated pattern to match both numbers and letters: IG-12345 or IG-B0XJDN
  const codePattern = /\b(IG-[A-Z0-9]{5,6})\b/;
  const match = text.match(codePattern);
  return match ? match[1] : null;
}

/**
 * Processes an Instagram verification code and updates the channel configuration
 * @param verificationCode - The verification code found in the message
 * @param senderId - The ID of the message sender (business account ID)
 * @param supabase - Supabase client
 * @returns Promise<boolean> - true if verification was processed successfully
 */
async function processInstagramVerification(
  verificationCode: string,
  senderId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    console.log('🔧 Processing Instagram verification:', { verificationCode, senderId });

    // Find pending verification with this code
    const { data: verification, error: verificationError } = await supabase
      .from('instagram_verifications')
      .select(`
        id,
        user_id,
        channel_id,
        verification_code,
        status,
        expires_at
      `)
      .eq('verification_code', verificationCode)
      .eq('status', 'pending')
      .single();

    if (verificationError || !verification) {
      console.log('❌ No pending verification found for code:', verificationCode);
      return false;
    }

    // Check if verification has expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      console.log('⏰ Verification code has expired:', verificationCode);

      // Mark as expired
      await supabase
        .from('instagram_verifications')
        .update({
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', verification.id);

      return false;
    }

    console.log('✅ Valid verification found:', {
      id: verification.id,
      channel_id: verification.channel_id,
      user_id: verification.user_id
    });

    // 🔥 NEW: Get the channel using the channel_id from verification (not by business account ID)
    // This ensures we find the right channel even when IDs don't match
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('id', verification.channel_id)
      .eq('user_id', verification.user_id)
      .eq('channel_type', 'instagram')
      .single();

    if (channelError || !channel) {
      console.error('❌ Channel not found for verification:', {
        channel_id: verification.channel_id,
        user_id: verification.user_id,
        error: channelError
      });
      return false;
    }

    console.log('✅ Found Instagram channel for verification:', {
      channel_id: channel.id,
      user_id: channel.user_id,
      current_business_id: (channel.channel_config as InstagramChannelConfig)?.instagram_business_account_id
    });

    // Update channel configuration with correct business account ID
    const currentConfig: InstagramChannelConfig = channel.channel_config;
    const updatedConfig: InstagramChannelConfig = {
      ...currentConfig,
      instagram_business_account_id: senderId, // This is the correct business account ID from webhook
      webhook_subscribed: true,
      verified_at: now.toISOString()
    };

    console.log('🔄 Updating channel config with verified business account ID:', {
      channel_id: verification.channel_id,
      old_business_id: currentConfig?.instagram_business_account_id,
      new_business_id: senderId,
      instagram_user_id: currentConfig?.instagram_user_id,
      username: currentConfig?.username
    });

    // Update the channel
    const { error: updateError } = await supabase
      .from('communication_channels')
      .update({
        channel_config: updatedConfig,
        updated_at: now.toISOString()
      })
      .eq('id', verification.channel_id);

    if (updateError) {
      console.error('❌ Error updating channel:', updateError);
      return false;
    }

    console.log('✅ Channel updated successfully with new business account ID');

    // Mark verification as completed
    const { error: verificationUpdateError } = await supabase
      .from('instagram_verifications')
      .update({
        status: 'completed',
        business_account_id: senderId,
        sender_id: senderId,
        message_content: verificationCode,
        verified_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', verification.id);

    if (verificationUpdateError) {
      console.error('❌ Error updating verification status:', verificationUpdateError);
      // Don't return false here since the channel was updated successfully
    }

    console.log('✅ Instagram verification completed successfully:', {
      verification_code: verificationCode,
      channel_id: verification.channel_id,
      old_business_account_id: currentConfig?.instagram_business_account_id,
      new_business_account_id: senderId,
      status: 'completed'
    });

    return true;

  } catch (error) {
    console.error('❌ Error processing Instagram verification:', error);
    return false;
  }
}

/**
 * Get Instagram user profile (username and profile picture)
 * @param userId - Instagram user IGSID (not business account ID)
 * @param accessToken - Instagram access token
 * @returns Promise with name and avatar_url
 */
async function getInstagramUserProfile(
  userId: string,
  accessToken: string
): Promise<{ name: string; avatar_url?: string }> {
  try {
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v24.0';
    // Use 'profile_pic' field to get the profile picture URL
    // Note: This URL expires after a few days, so we should ideally cache the image or refresh it
    const url = `https://graph.instagram.com/${graphVersion}/${userId}?fields=username,profile_pic&access_token=${accessToken}`;

    console.log('🔍 Fetching Instagram profile:', { userId, graphVersion });

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error fetching Instagram profile:', {
        status: response.status,
        error: errorText,
        userId
      });
      // Fallback
      return {
        name: `Instagram User ${userId.slice(-4)}`,
        avatar_url: undefined
      };
    }

    const data = await response.json();
    console.log('✅ Instagram profile data received:', JSON.stringify(data));

    const username = data.username || `Instagram User ${userId.slice(-4)}`;
    const avatarUrl = data.profile_pic;

    return {
      name: `@${username}`,
      avatar_url: avatarUrl
    };
  } catch (error) {
    console.error('❌ Error in getInstagramUserProfile:', error);
    // Fallback on error
    return {
      name: `Instagram User ${userId.slice(-4)}`,
      avatar_url: undefined
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

    // 🔧 Check if this message contains a verification code (PRIORITY CHECK)
    const verificationCode = extractVerificationCode(text);
    if (verificationCode) {
      console.log('🎯 Instagram verification code detected:', verificationCode);

      // Process verification - senderId is the business account ID in this case
      const verificationProcessed = await processInstagramVerification(verificationCode, senderId, supabase);

      if (verificationProcessed) {
        console.log('✅ Instagram verification completed, continuing with normal message processing');
        // Continue processing as normal message after verification
      } else {
        console.log('⚠️ Verification processing failed, continuing as normal message');
        // Continue processing as normal message even if verification failed
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
      .eq('channel_type', 'instagram')
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
        .eq('channel_type', 'instagram')
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
          .eq('channel_type', 'instagram');

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
            return config?.instagram_user_id === webhookBusinessId ||
              config?.instagram_business_account_id === webhookBusinessId;
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

    const { data: existingClient, error: clientSearchError } = await supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('phone', realUserId)
      .single();

    // Fetch profile info if needed (new client or missing info)
    let profileInfo = { name: `Instagram User ${realUserId.slice(-4)}`, avatar_url: undefined };

    // Diagnostic logging for profile fetching
    console.log('🔍 Instagram profile fetch attempt:', {
      hasToken: !!channel.channel_config.access_token,
      tokenPreview: channel.channel_config.access_token ? `${channel.channel_config.access_token.substring(0, 10)}...` : 'MISSING',
      realUserId,
      channelId: channel.id
    });

    // Only fetch from Instagram if we have the token
    if (channel.channel_config.access_token) {
      console.log('📞 Calling getInstagramUserProfile...');
      profileInfo = await getInstagramUserProfile(realUserId, channel.channel_config.access_token);
      console.log('✅ Instagram profile fetch result:', profileInfo);
    } else {
      console.warn('⚠️ Skipping Instagram profile fetch: access_token is missing from channel_config');
    }

    if (existingClient && !clientSearchError) {
      client = existingClient;
      console.log('✅ Found existing client:', client.id);

      // Update client info if name is generic or avatar is missing
      const needsUpdate = (
        (!client.name || client.name.startsWith('Instagram User')) ||
        !client.avatar_url
      );

      if (needsUpdate && profileInfo) {
        console.log('📝 Updating Instagram client with fresh profile data:', {
          client_id: client.id,
          old_name: client.name,
          new_name: profileInfo.name,
          has_avatar: !!profileInfo.avatar_url
        });

        const { error: updateError } = await supabase
          .from('crm_clients')
          .update({
            name: profileInfo.name,
            avatar_url: profileInfo.avatar_url || client.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.id);

        if (!updateError) {
          client.name = profileInfo.name;
          client.avatar_url = profileInfo.avatar_url || client.avatar_url;
          console.log('✅ Instagram client updated with profile data');
        } else {
          console.error('❌ Failed to update Instagram client:', updateError);
        }
      }
    } else {
      // Create new client with profile info
      const { data: newClient, error: clientCreateError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: profileInfo.name,
          phone: realUserId,
          avatar_url: profileInfo.avatar_url,
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

    // Update conversation (increment unread count for client messages)
    await supabase.rpc('increment_unread', { conversation_id: conversation.id });

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

        const { data: aiConfig } = await supabase
          .from('ai_configurations')
          .select('*')
          .eq('user_id', conversation.user_id)
          .limit(1)
          .maybeSingle();

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