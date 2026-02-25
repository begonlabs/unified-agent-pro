import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const partnerToken = Deno.env.get('GREEN_API_PARTNER_TOKEN')

        if (!partnerToken) {
            throw new Error('GREEN_API_PARTNER_TOKEN is not configured')
        }

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
        const { user_id, plan_type } = await req.json()

        if (!user_id) {
            throw new Error('user_id is required')
        }

        console.log(`🚀 Creating Green API instance for user ${user_id} (Plan: ${plan_type})`)

        // 1. Create instance via Partner API
        const createUrl = `https://api.green-api.com/partner/createInstance/${partnerToken}`
        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })

        if (!createResponse.ok) {
            const errorText = await createResponse.text()
            console.error('Green API Partner Error:', errorText)
            throw new Error(`Failed to create instance: ${errorText}`)
        }

        const instanceData = await createResponse.json()
        console.log('✅ Instance created successfully:', instanceData)

        // The expected response from Green API createInstance partner endpoint:
        // { idInstance: "...", apiTokenInstance: "..." }
        const { idInstance, apiTokenInstance } = instanceData

        if (!idInstance || !apiTokenInstance) {
            throw new Error('Incomplete response from Green API')
        }

        // 2. Save instance to communication_channels
        const { error: insertError } = await supabase
            .from('communication_channels')
            .insert({
                user_id: user_id,
                channel_type: 'whatsapp_green_api',
                channel_config: {
                    idInstance,
                    apiTokenInstance,
                    apiUrl: 'https://7107.api.green-api.com',
                    connected_at: new Date().toISOString(),
                    is_automated: true
                },
                is_connected: false // It starts as disconnected until QR is scanned
            })

        if (insertError) {
            console.error('Error saving channel to DB:', insertError)
            throw insertError
        }

        return new Response(
            JSON.stringify({
                success: true,
                idInstance,
                message: 'Instance created and assigned successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in create-green-api-instance:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
