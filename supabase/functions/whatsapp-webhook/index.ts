// whatsapp-webhook/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: WhatsApp Business API Webhook Handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleWhatsAppEvent } from './handlers/whatsapp.ts'

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
  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");

  if (!signatureHeader || !appSecret) {
    console.error('Missing signature header or WHATSAPP_APP_SECRET');
    return false;
  }

  console.log('🔐 Verifying WhatsApp signature:', {
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
  console.log('🔐 WhatsApp signature verification result:', {
    isValid,
    expectedLength: expectedSignature.length,
    receivedLength: signatureHeader.length
  });
  
  return isValid;
}

interface WhatsAppWebhookEvent {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          profile?: {
            name?: string;
          };
          wa_id?: string;
        }>;
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          text?: {
            body?: string;
          };
          type?: string;
          context?: {
            from?: string;
            id?: string;
          };
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
          timestamp?: string;
          recipient_id?: string;
        }>;
      };
      field?: string;
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
    if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
      console.log('✅ WhatsApp webhook verified successfully');
      return new Response(challenge, { headers: corsHeaders })
    }

    // Process incoming webhook events
    if (req.method === 'POST') {
      const rawBody = await req.text()
      
      // Verify signature for security
      console.log('🔍 Verifying WhatsApp webhook signature...');
      if (!(await isValidSignature(req, rawBody))) {
        console.error('❌ Invalid WhatsApp webhook signature');
        return new Response('Unauthorized', { status: 401, headers: corsHeaders })
      }
      console.log('✅ WhatsApp webhook signature verified successfully');

      const body: WhatsAppWebhookEvent = JSON.parse(rawBody)
      
      // Log the complete webhook payload first
      console.log('📦 Complete WhatsApp webhook payload:', JSON.stringify(body, null, 2));

      if (body.object === 'whatsapp_business_account' && body.entry) {
        console.log('📱 Processing WhatsApp Business events:', {
          object: body.object,
          entry_count: body.entry.length
        });
        
        for (const entry of body.entry) {
          if (entry.changes) {
            console.log('🔄 Processing WhatsApp changes:', {
              entry_id: entry.id,
              changes_count: entry.changes.length
            });
            
            // Log all changes first
            entry.changes.forEach((change, index) => {
              console.log(`📋 Change ${index + 1}/${entry.changes.length}:`, {
                field: change.field,
                has_messages: !!change.value?.messages,
                messages_count: change.value?.messages?.length || 0,
                has_statuses: !!change.value?.statuses,
                statuses_count: change.value?.statuses?.length || 0,
                phone_number_id: change.value?.metadata?.phone_number_id
              });
            });
            
            for (const change of entry.changes) {
              // Log the full change structure for debugging
              console.log('🔍 Full WhatsApp change:', JSON.stringify(change, null, 2));
              
              if (change.field === 'messages' && change.value) {
                const { messages, statuses, contacts, metadata } = change.value;
                
                // Process incoming messages
                if (messages && messages.length > 0) {
                  for (const message of messages) {
                    console.log('📨 Processing WhatsApp message:', {
                      message_id: message.id,
                      from: message.from,
                      type: message.type,
                      text: message.text?.body,
                      timestamp: message.timestamp,
                      phone_number_id: metadata?.phone_number_id
                    });

                    await handleWhatsAppEvent({
                      message,
                      contacts,
                      metadata,
                      type: 'message'
                    });
                    console.log('✅ WhatsApp message processed successfully');
                  }
                }
                
                // Process message statuses (delivered, read, etc.)
                if (statuses && statuses.length > 0) {
                  for (const status of statuses) {
                    console.log('📊 Processing WhatsApp status:', {
                      message_id: status.id,
                      status: status.status,
                      recipient_id: status.recipient_id,
                      timestamp: status.timestamp
                    });

                    await handleWhatsAppEvent({
                      status,
                      metadata,
                      type: 'status'
                    });
                    console.log('✅ WhatsApp status processed successfully');
                  }
                }
              }
            }
          }
        }
      } else {
        console.log('⚠️ Unexpected WhatsApp webhook format:', {
          object: body.object,
          has_entries: !!body.entry
        });
      }

      return new Response('OK', { headers: corsHeaders })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Error in whatsapp-webhook function:', error)
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