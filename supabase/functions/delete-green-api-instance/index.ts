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

        // Fallback token for self-hosted instances where env injection is complex
        const DEFAULT_PARTNER_TOKEN = "gac.b65e351592e54d99b4cefb1c4bde15cd599d5bc2b9e045"
        const partnerToken = Deno.env.get('GREEN_API_PARTNER_TOKEN') || DEFAULT_PARTNER_TOKEN

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('No authorization header')
        }

        const { idInstance, user_id } = await req.json()

        if (!idInstance || !user_id) {
            throw new Error('idInstance y user_id son requeridos')
        }

        console.log(`🗑️ Solicitando eliminación de instancia ${idInstance} para usuario ${user_id}`);

        // 1. Delete from Green API Partner API
        const deleteUrl = `https://api.green-api.com/partner/deleteInstanceAccount/${partnerToken}`
        const deleteResponse = await fetch(deleteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idInstance: String(idInstance) })
        })

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json()
            console.warn(`⚠️ Green API Error al borrar instancia: ${JSON.stringify(errorData)}`);
            // Seguimos adelante para limpiar de Supabase incluso si falló en Green API (ej: ya borrada)
        } else {
            console.log(`✅ Instancia ${idInstance} borrada exitosamente de Green API`);
        }

        // 2. Delete from communication_channels in Supabase
        const { error: deleteError } = await supabase
            .from('communication_channels')
            .delete()
            .eq('user_id', user_id)
            .eq('channel_type', 'whatsapp_green_api')
            .eq('channel_config->>idInstance', String(idInstance));

        if (deleteError) {
            throw deleteError;
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Instancia ${idInstance} eliminada correctamente`
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in delete-green-api-instance:', error)
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
