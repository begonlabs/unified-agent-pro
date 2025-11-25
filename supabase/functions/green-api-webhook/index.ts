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

            // Only process incoming messages
            if (body.typeWebhook === 'incomingMessageReceived' && body.messageData) {
                console.log('📱 Processing Green API incoming message:', {
                    idInstance: body.instanceData?.idInstance,
                    sender: body.senderData?.sender,
                    chatId: body.senderData?.chatId,
                    messageType: body.messageData?.typeMessage
                });

                await handleGreenApiEvent(body);
                console.log('✅ Green API message processed successfully');
            } else {
                console.log('⏭️ Skipping non-message webhook:', {
                    typeWebhook: body.typeWebhook,
                    hasMessageData: !!body.messageData
                });
            }

            return new Response('OK', { headers: corsHeaders })
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
