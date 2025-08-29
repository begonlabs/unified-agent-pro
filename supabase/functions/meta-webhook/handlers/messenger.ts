// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Facebook Messenger Event Handler
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
}

interface Message {
  conversation_id: string;
  content: string;
  sender_type: string;
  is_automated: boolean;
  sender_name?: string;
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

    // Determine the page ID based on echo status
    // For echo messages: sender = page, recipient = user → page_id = sender
    // For normal messages: sender = user, recipient = page → page_id = recipient
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
      hasIsEcho: event.message?.hasOwnProperty('is_echo'),
      isEchoValue: event.message?.is_echo,
      senderId,
      recipientId
    });

    // Find or create client (handle echo messages)
    let client: CRMClient;
    
    // For Facebook messages:
    // - Normal message: sender = user, recipient = page → client = sender
    // - Echo message: sender = page, recipient = user → client = recipient
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
    
    console.log('📋 Message classification:', {
      isEcho,
      senderType,
      senderName,
      logic: isEcho ? 'Echo message → agent (outgoing)' : 'Normal message → client (incoming)'
    });

    // Save message with new structure (Option 2)
    const messageData = {
      conversation_id: conversation.id,
      content: messageText,
      sender_type: senderType,
      is_automated: false, // Could be automated if it's a bot message
      sender_name: senderName,
      platform_message_id: messageId, // Facebook message ID
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

  } catch (error) {
    console.error('Critical error in handleMessengerEvent:', error);
  }
}