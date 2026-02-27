import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getGreenApiHost } from '../_shared/greenapi.ts'

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

        // Fallback token for self-hosted instances where env injection is complex
        const DEFAULT_PARTNER_TOKEN = "gac.b65e351592e54d99b4cefb1c4bde15cd599d5bc2b9e045"
        const partnerToken = Deno.env.get('GREEN_API_PARTNER_TOKEN') || DEFAULT_PARTNER_TOKEN

        if (!partnerToken || partnerToken === 'undefined') {
            throw new Error('GREEN_API_PARTNER_TOKEN no está configurado en el servidor.');
        }

        // Create a Supabase client with the Service Role Key for administrative tasks
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        // Check for authorization (could be Service Role from webhook or User Session from frontend)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { user_id, plan_type } = await req.json()

        if (!user_id) {
            throw new Error('user_id is required');
        }

        // 0. Safety Check: Does the user already have an instance?
        console.log(`🔍 Verificando si el usuario ${user_id} ya tiene una instancia asignada...`);
        const { data: existingChannel } = await supabase
            .from('communication_channels')
            .select('*')
            .eq('user_id', user_id)
            .eq('channel_type', 'whatsapp_green_api')
            .maybeSingle();

        if (existingChannel) {
            console.log(`✅ Instancia existente encontrada: ${existingChannel.channel_config.idInstance}. Devolviendo credenciales actuales.`);
            return new Response(
                JSON.stringify({
                    success: true,
                    idInstance: existingChannel.channel_config.idInstance,
                    apiTokenInstance: existingChannel.channel_config.apiTokenInstance,
                    apiUrl: existingChannel.channel_config.apiUrl,
                    message: 'Se reutilizó la instancia existente'
                }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200,
                }
            )
        }

        console.log(`🚀 Solicitando nueva instancia a Green API (User: ${user_id}, Plan: ${plan_type})`);

        // 1. Create instance via Partner API
        const createUrl = `https://api.green-api.com/partner/createInstance/${partnerToken}`
        const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        })

        const instanceData = await createResponse.json()
        console.log('📡 Respuesta de Green API:', JSON.stringify(instanceData))

        if (!createResponse.ok) {
            throw new Error(`Green API Error: ${instanceData.message || createResponse.statusText}`)
        }

        // The expected response from Green API createInstance partner endpoint:
        // { idInstance: "...", apiTokenInstance: "...", host: "..." }
        const { idInstance, apiTokenInstance, host } = instanceData

        if (!idInstance || !apiTokenInstance) {
            throw new Error('Respuesta incompleta de Green API al crear instancia')
        }
        const apiUrl = getGreenApiHost(idInstance, host ? `https://${host}` : undefined).replace(/\/$/, '')
        console.log(`📡 Usando host: ${apiUrl} para la instancia ${idInstance}`)

        // 2. Configurar instancia automáticamente
        // Esperamos un poco para que la instancia esté disponible para configuración
        console.log('⏳ Esperando 5 segundos para configurar la instancia...')
        await new Promise(resolve => setTimeout(resolve, 5000))

        try {
            console.log('⚙️ Configurando Webhooks y Permisos...')

            // Configurar Webhook URL y habilitar notificaciones
            const settingsUrl = `${apiUrl}/waInstance${idInstance}/setSettings/${apiTokenInstance}`
            const settingsData = {
                webhookUrl: "https://supabase.ondai.ai/functions/v1/green-api-webhook",
                incomingWebhook: "yes",
                outgoingWebhook: "yes",
                stateWebhook: "yes",
                incomingMessageWebhook: "yes",
                outgoingMessageWebhook: "yes",
                outgoingAPIMessageWebhook: "yes",
                markIncomingMessagesReaded: "yes"
            }

            const settingsResponse = await fetch(settingsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            })

            if (settingsResponse.ok) {
                console.log('✅ Instancia configurada exitosamente')
            } else {
                const settingsError = await settingsResponse.text()
                console.warn('⚠️ No se pudo configurar la instancia automáticamente:', settingsError)
            }
        } catch (configError) {
            console.error('❌ Error durante la configuración de la instancia:', configError)
            // No bloqueamos el proceso si la configuración falla, el usuario puede hacerlo manual
        }

        // 3. Save instance to communication_channels (Checking for duplicates first)
        console.log(`🧹 Limpiando duplicados previos para instancia ${idInstance}...`);
        await supabase
            .from('communication_channels')
            .delete()
            .eq('user_id', user_id)
            .eq('channel_type', 'whatsapp_green_api')
            .eq('channel_config->>idInstance', String(idInstance));

        const { error: insertError } = await supabase
            .from('communication_channels')
            .insert({
                user_id: user_id,
                channel_type: 'whatsapp_green_api',
                channel_config: {
                    idInstance,
                    apiTokenInstance,
                    apiUrl: apiUrl,
                    connected_at: new Date().toISOString(),
                    is_automated: true
                },
                is_connected: false
            })

        if (insertError) {
            console.error('Error saving channel to DB:', insertError)
            throw insertError
        }

        return new Response(
            JSON.stringify({
                success: true,
                idInstance,
                apiTokenInstance,
                apiUrl,
                message: 'Instancia creada, configurada y asignada exitosamente'
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
