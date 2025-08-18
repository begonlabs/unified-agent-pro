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
}

/**
 * Processes an Instagram event, saves the message to the database,
 * and associates it with the corresponding channel.
 * @param event - Event received from the Instagram webhook
 * @returns Promise<void>
 */
export async function handleInstagramEvent(event: InstagramEvent): Promise<void> {

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not configured.');
    return;
  }

  // extract event information
  const senderId = event.sender?.id;
  const pageId = event.recipient?.id;
  const timestamp = event.timestamp;
  const message = event.message;

  // validate that the event is a valid text message
  if (!message?.text || message.is_echo || !senderId || !pageId) {
    console.log('Event ignored: Not a valid text message or is an echo.');
    return;
  }

  const { text, mid: messageId } = message;

  console.log(`[Instagram] Message received from ${senderId} for page ${pageId}: "${text}"`);

  try {
    // initialize Supabase client
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // query communication channel by page_id
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('id, user_id')
      .eq('channel_config->>page_id', pageId)
      .single();

    if (channelError || !channel) {
      console.error(
        `[Instagram] No channel found for page ${pageId}`,
        channelError?.message || 'Channel not found'
      );
      return;
    }

    // message into the database
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        channel_id: (channel as CommunicationChannel).id,
        user_id: (channel as CommunicationChannel).user_id,
        sender_id: senderId,
        recipient_id: pageId,
        content: text,
        provider_message_id: messageId,
        metadata: {
          provider: 'instagram',
          timestamp,
        },
      });

    if (insertError) {
      console.error('[Instagram] Error saving message to database:', insertError.message);
      return;
    }

    console.log(`[Instagram] Message from ${senderId} saved successfully.`);

  } catch (error) {
    console.error('[Instagram] Exception processing event:', error instanceof Error ? error.message : error);
  }
}