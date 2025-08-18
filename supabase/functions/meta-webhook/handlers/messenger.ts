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
    console.log('Processing Messenger event:', JSON.stringify(event, null, 2));

    // Skip if no message content
    if (!event.message?.text && !event.postback) {
      console.log('No message content or postback, skipping');
      return;
    }

    const senderId = event.sender?.id;
    const recipientId = event.recipient?.id;
    const messageText = event.message?.text || event.postback?.title || 'Postback received';
    const messageId = event.message?.mid || `postback_${Date.now()}`;

    if (!senderId || !recipientId) {
      console.error('Missing sender or recipient ID');
      return;
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the communication channel for this page
    const { data: channels, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('channel_type', 'facebook')
      .eq('is_connected', true)
      .filter('channel_config->>page_id', 'eq', recipientId);

    if (channelError || !channels || channels.length === 0) {
      console.error('No Facebook channel found for page:', recipientId);
      return;
    }

    const channel = channels[0];
    console.log('Found channel:', channel.id, 'for user:', channel.user_id);

    // Find or create CRM client
    let client: CRMClient | null = null;
    const { data: existingClients, error: clientSearchError } = await supabase
      .from('crm_clients')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('phone', senderId)
      .maybeSingle();

    if (clientSearchError && clientSearchError.code !== 'PGRST116') {
      console.error('Error searching for client:', clientSearchError);
      return;
    }

    if (existingClients) {
      client = existingClients;
      console.log('Found existing client:', client.id);
    } else {
      // Create new client
      const { data: newClient, error: createClientError } = await supabase
        .from('crm_clients')
        .insert({
          user_id: channel.user_id,
          name: `Cliente Facebook ${senderId.slice(-4)}`,
          phone: senderId,
          status: 'lead',
          last_interaction: new Date().toISOString()
        })
        .select()
        .single();

      if (createClientError) {
        console.error('Error creating client:', createClientError);
        return;
      }

      client = newClient;
      console.log('Created new client:', client.id);
    }

    // Find or create conversation
    let conversation: Conversation | null = null;
    const { data: existingConversations, error: convSearchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', channel.user_id)
      .eq('client_id', client.id)
      .eq('channel', 'facebook')
      .eq('channel_thread_id', senderId)
      .maybeSingle();

    if (convSearchError && convSearchError.code !== 'PGRST116') {
      console.error('Error searching for conversation:', convSearchError);
      return;
    }

    if (existingConversations) {
      conversation = existingConversations;
      console.log('Found existing conversation:', conversation.id);
    } else {
      // Create new conversation
      const { data: newConversation, error: createConvError } = await supabase
        .from('conversations')
        .insert({
          user_id: channel.user_id,
          client_id: client.id,
          channel: 'facebook',
          channel_thread_id: senderId,
          status: 'open',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createConvError) {
        console.error('Error creating conversation:', createConvError);
        return;
      }

      conversation = newConversation;
      console.log('Created new conversation:', conversation.id);
    }

    // Save the incoming message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        content: messageText,
        sender_type: 'client',
        is_automated: false,
        sender_name: `Cliente ${senderId.slice(-4)}`
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      return;
    }

    // Update conversation last_message_at
    const { error: updateConvError } = await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'open'
      })
      .eq('id', conversation.id);

    if (updateConvError) {
      console.error('Error updating conversation:', updateConvError);
    }

    // Update client last_interaction
    const { error: updateClientError } = await supabase
      .from('crm_clients')
      .update({ 
        last_interaction: new Date().toISOString()
      })
      .eq('id', client.id);

    if (updateClientError) {
      console.error('Error updating client:', updateClientError);
    }

    console.log('Successfully processed Messenger event');
    console.log('- Client:', client.id);
    console.log('- Conversation:', conversation.id);
    console.log('- Message saved');

  } catch (error) {
    console.error('Error in handleMessengerEvent:', error);
  }
}