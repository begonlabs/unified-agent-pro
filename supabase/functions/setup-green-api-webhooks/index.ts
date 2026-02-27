import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

        const providedHost = apiUrl || (String(idInstance).startsWith('77') ? 'https://7700.api.green-api.com' : 'https://7107.api.green-api.com')

        // Robustez: Forzar host correcto basado en el ID si es un ID conocido
        const idStr = String(idInstance)
        let host = providedHost
        if (idStr.startsWith('77')) {
            host = 'https://7700.api.green-api.com'
        } else if (idStr.startsWith('71')) {
            host = 'https://7107.api.green-api.com'
        }

        console.log(`⚙️ Configurando Webhooks para instancia ${idInstance} en ${host}...`)

        // Configurar Webhook URL y habilitar notificaciones
        const settingsUrl = `${host}/waInstance${idInstance}/setSettings/${apiTokenInstance}`
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
