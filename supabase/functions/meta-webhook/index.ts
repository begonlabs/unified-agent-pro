// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Meta Webhook Handler for Facebook Messenger and Instagram
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleMessengerEvent } from './handlers/messenger.ts'
import { handleInstagramEvent } from './handlers/instagram.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utility function to convert ArrayBuffer to hex string
function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Safe string comparison to prevent timing attacks
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Verify webhook signature for security
async function isValidSignature(request: Request, rawBody: string): Promise<boolean> {
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const appSecret = Deno.env.get("META_APP_SECRET");

  if (!signatureHeader || !appSecret) {
    console.error('Missing signature header or META_APP_SECRET');
    return false;
  }

  console.log('🔐 Verifying signature:', {
    hasSignature: !!signatureHeader,
    hasAppSecret: !!appSecret,
    bodyLength: rawBody.length
  });

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  
  const expectedSignature = `sha256=${toHex(digest)}`;
  
  const isValid = safeEqual(expectedSignature, signatureHeader);
  console.log('🔐 Signature verification result:', {
    isValid,
    expectedLength: expectedSignature.length,
    receivedLength: signatureHeader.length
  });
  
  return isValid;
}

interface WebhookEvent {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: Array<{
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
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Webhook verification
    if (mode === 'subscribe' && token === Deno.env.get('META_VERIFY_TOKEN')) {
      return new Response(challenge, { headers: corsHeaders })
    }

    // Process incoming webhook events
    if (req.method === 'POST') {
      const rawBody = await req.text()
      
              // Verify signature for security
        console.log('🔍 Verifying webhook signature...');
        if (!(await isValidSignature(req, rawBody))) {
          console.error('❌ Invalid webhook signature');
          return new Response('Unauthorized', { status: 401, headers: corsHeaders })
        }
        console.log('✅ Webhook signature verified successfully');

      const body: WebhookEvent = JSON.parse(rawBody)
      
      // Log the complete webhook payload first
      console.log('📦 Complete webhook payload:', JSON.stringify(body, null, 2));

      if (body.object === 'page' && body.entry) {
        console.log('📋 Processing Facebook page events:', {
          object: body.object,
          entry_count: body.entry.length
        });
        
        for (const entry of body.entry) {
          if (entry.messaging) {
            console.log('💬 Processing messaging events:', {
              entry_id: entry.id,
              messaging_count: entry.messaging.length
            });
            
            // Log all messaging events first
            entry.messaging.forEach((event, index) => {
              console.log(`📋 Event ${index + 1}/${entry.messaging.length}:`, {
                has_message: !!event.message,
                message_text: event.message?.text,
                is_echo: event.message?.is_echo,
                has_postback: !!event.postback,
                has_delivery: !!event.delivery,
                has_read: !!event.read,
                sender_id: event.sender?.id,
                recipient_id: event.recipient?.id
              });
            });
            
            for (const messagingEvent of entry.messaging) {
              // Log the full event structure for debugging
              console.log('🔍 Full messaging event:', JSON.stringify(messagingEvent, null, 2));
              
              // Echo messages are now processed to save outgoing agent messages
              // if (messagingEvent.message?.is_echo) {
              //   console.log('⏭️ Skipping echo message');
              //   continue;
              // }

              // Only process events with actual content
              const hasContent = messagingEvent.message?.text || 
                               messagingEvent.postback?.payload || 
                               messagingEvent.delivery?.mids?.length > 0 ||
                               messagingEvent.read?.watermark;

              if (!hasContent) {
                console.log('⏭️ Skipping event without content:', {
                  has_message: !!messagingEvent.message,
                  has_postback: !!messagingEvent.postback,
                  has_delivery: !!messagingEvent.delivery,
                  has_read: !!messagingEvent.read,
                  message_text: messagingEvent.message?.text,
                  postback_payload: messagingEvent.postback?.payload
                });
                continue;
              }

              console.log('🔄 Processing messaging event:', {
                sender_id: messagingEvent.sender?.id,
                recipient_id: messagingEvent.recipient?.id,
                has_message: !!messagingEvent.message,
                message_text: messagingEvent.message?.text,
                has_postback: !!messagingEvent.postback,
                postback_payload: messagingEvent.postback?.payload,
                has_delivery: !!messagingEvent.delivery,
                has_read: !!messagingEvent.read
              });

              // Process the message
              await handleMessengerEvent(messagingEvent);
              console.log('✅ Event processed successfully');
            }
          }
        }
      } else {
        console.log('⚠️ Unexpected webhook format:', {
          object: body.object,
          has_entries: !!body.entry
        });
      }

      return new Response('OK', { headers: corsHeaders })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Error in meta-webhook function:', error)
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: `Internal server error: ${error.message}`,
        debug: { request_url: req.url }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})  