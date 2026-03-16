// green-api-webhook/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: Green API Webhook Handler for WhatsApp
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleGreenApiEvent } from './handlers/greenapi.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GreenApiWebhookEvent {
    typeWebhook?: string;
    stateInstance?: string;
    instanceData?: {
        idInstance: number;
        wid: string;
        typeInstance: string;
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
    };
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Process incoming webhook events
        if (req.method === 'POST') {
            const rawBody = await req.text()
            const body: GreenApiWebhookEvent = JSON.parse(rawBody)

            // Log the complete webhook payload
            console.log('📦 Complete Green API webhook payload:', JSON.stringify(body, null, 2));

            // Only process incoming messages or state changes
            if ((body.typeWebhook === 'incomingMessageReceived' && body.messageData) || body.typeWebhook === 'stateInstanceChanged') {
                console.log('📱 Green API event detected:', {
                    typeWebhook: body.typeWebhook,
                    idInstance: body.instanceData?.idInstance,
                    state: body.stateInstance
                });

                // 🔥 CRITICAL: Process synchronously to avoid premature isolate termination in self-hosted environments
                try {
                    await handleGreenApiEvent(body);
                    console.log('✅ Green API event processed successfully');
                } catch (err) {
                    console.error('❌ Error processing Green API event:', err);
                }

                return new Response('OK', { headers: corsHeaders });
            } else {
                console.log('⏭️ Skipping non-message/non-state webhook:', body.typeWebhook);
                return new Response('OK', { headers: corsHeaders });
            }
        }

        return new Response('Method not allowed', { status: 405, headers: corsHeaders })

    } catch (error) {
        console.error('Error in green-api-webhook function:', error)
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
