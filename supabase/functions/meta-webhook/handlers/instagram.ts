// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// supabase-project/volumes/meta-webhook/handlers/instagram.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Get channel by page_id
    console.log('🔍 Looking for Instagram channel with page_id:', pageId);
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('channel_config->>page_id', pageId)
      .eq('channel_type', 'instagram')
      .single();

    if (channelError || !channel) {
      console.error('❌ No Instagram channel found for page:', pageId, channelError?.message);
      return;
    }

    console.log('✅ Found Instagram channel:', { id: channel.id, user_id: channel.user_id });

    // Determine if this is an echo message early
    const isEcho = message.is_echo || false;

    // Find or create client (handle echo messages)
    let client: CRMClient;
    
    // For echo messages, we might need to find client by recipient instead of sender
    const clientId = isEcho ? pageId : senderId;
    
    const { data: existingClient, error: clientSearchError } = await supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('phone', clientId)
      .single();

    if (existingClient && !clientSearchError) {
      client = existingClient;
      console.log('✅ Found existing client:', client.id);
    } else {
      // Create new client
      const clientName = isEcho 
        ? `Instagram User ${clientId.slice(-4)}` 
        : `Instagram User ${clientId.slice(-4)}`;
        
      const { data: newClient, error: clientCreateError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: clientName,
          phone: clientId,
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
    const threadId = isEcho ? pageId : senderId; // Use pageId for echo, senderId for normal
    
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
          last_message_at: new Date().toISOString()
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

    // Save message with new structure (Option 2)
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

  } catch (error) {
    console.error('Critical error in handleInstagramEvent:', error instanceof Error ? error.message : error);
  }
}