import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
        const { idInstance, apiTokenInstance, apiUrl } = await req.json()

        if (!idInstance || !apiTokenInstance) {
            throw new Error('idInstance y apiTokenInstance son requeridos')
        }

        const host = getGreenApiHost(idInstance, apiUrl).replace(/\/$/, '')

        console.log(`⚙️ Configurando Webhooks para instancia ${idInstance} en ${host}...`)

        // Configurar Webhook URL y habilitar notificaciones
        // Usar SUPABASE_URL dinámico para que funcione en cualquier proyecto (OndAI o dev)
        const projectUrl = Deno.env.get('SUPABASE_URL') || "https://supabase.ondai.ai"
        const webhookUrl = `${projectUrl.replace(/\/$/, '')}/functions/v1/green-api-webhook`

        console.log(`⚙️ Apuntando webhooks a: ${webhookUrl}`)

        const settingsUrl = `${host}/waInstance${idInstance}/setSettings/${apiTokenInstance}`
        const settingsData = {
            webhookUrl: webhookUrl,
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

        if (!settingsResponse.ok) {
            const settingsError = await settingsResponse.text()
            throw new Error(`Error Green API: ${settingsError}`)
        }

        console.log(`✅ Instancia ${idInstance} configurada exitosamente`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Instancia configurada exitosamente'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in setup-green-api-webhooks:', error)
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
