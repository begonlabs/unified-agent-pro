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

// Webhook verification function
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
  const signature = request.headers.get('x-hub-signature-256');
  if (!signature) {
    console.log('No signature header found');
    return false;
  }

  const appSecret = Deno.env.get('META_APP_SECRET');
  if (!appSecret) {
    console.error('META_APP_SECRET not configured');
    return false;
  }

  const expectedSignature = 'sha256=' + toHex(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawBody + appSecret))
  );

  return safeEqual(signature, expectedSignature);
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
      if (!(await isValidSignature(req, rawBody))) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { status: 401, headers: corsHeaders })
      }

      const body: WebhookEvent = JSON.parse(rawBody)

      if (body.object === 'page' && body.entry) {
        for (const entry of body.entry) {
          if (entry.messaging) {
            for (const messagingEvent of entry.messaging) {
              // Skip echo messages (messages sent by the page)
              if (messagingEvent.message?.is_echo) {
                continue;
              }

              // Process the message
              await handleMessengerEvent(messagingEvent);
            }
          }
        }
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