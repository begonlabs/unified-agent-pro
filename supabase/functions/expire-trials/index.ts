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
        const DEFAULT_PARTNER_TOKEN = "gac.b65e351592e54d99b4cefb1c4bde15cd599d5bc2b9e045"
        const partnerToken = Deno.env.get('GREEN_API_PARTNER_TOKEN') || DEFAULT_PARTNER_TOKEN

        const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

        let specificUserId: string | null = null;
        if (req.method === 'POST') {
            try {
                const body = await req.json();
                if (body.user_id) specificUserId = body.user_id;
            } catch (e) {
                // Ignore parsing errors, it just means we run for all
            }
        } else if (req.method === 'GET') {
            const url = new URL(req.url);
            specificUserId = url.searchParams.get('user_id');
        }

        console.log(`🔍 Iniciando expire-trials. Target: ${specificUserId || 'TODOS'}`);

        let query = supabase
            .from('profiles')
            .select('user_id, email, is_trial, trial_end_date')
            .eq('is_trial', true)
            .lt('trial_end_date', new Date().toISOString());

        if (specificUserId) {
            query = query.eq('user_id', specificUserId);
        }

        const { data: expiredProfiles, error: fetchError } = await query;

        if (fetchError) {
            throw fetchError;
        }

        console.log(`Encontrados ${expiredProfiles?.length || 0} perfiles expirados para procesar.`);

        const results = [];

        for (const profile of expiredProfiles || []) {
            const userId = profile.user_id;
            console.log(`Procesando expiración para usuario: ${userId} (${profile.email})`);

            try {
                // 1. Encontrar y borrar instancias de Green API
                const { data: channels } = await supabase
                    .from('communication_channels')
                    .select('*')
                    .eq('user_id', userId);

                if (channels) {
                    for (const channel of channels) {
                        if (channel.channel_type === 'whatsapp_green_api' && channel.channel_config?.idInstance) {
                            const idInstance = channel.channel_config.idInstance;
                            console.log(`🗑️ Borrando instancia Green API: ${idInstance}`);
                            
                            const deleteUrl = `https://api.green-api.com/partner/deleteInstanceAccount/${partnerToken}`;
                            const deleteResponse = await fetch(deleteUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idInstance: String(idInstance) })
                            });

                            if (!deleteResponse.ok) {
                                console.warn(`⚠️ Error al borrar instancia ${idInstance} de Green API.`);
                            }
                        }
                    }
                }

                // 2. Limpiar todos los canales de forma dura
                await supabase.from('communication_channels').delete().eq('user_id', userId);
                await supabase.from('facebook_pages').delete().eq('user_id', userId);
                await supabase.from('instagram_accounts').delete().eq('user_id', userId);
                
                // Fallback attempt on green_api_instances specifically if it exists as a separate table
                await supabase.from('green_api_instances').delete().eq('user_id', userId).catch(() => {});

                // 3. Destruir el acceso premium en el perfil
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        is_trial: false,
                        plan_type: 'none',
                        payment_status: 'expired'
                    })
                    .eq('user_id', userId);

                if (updateError) throw updateError;

                results.push({ user_id: userId, status: 'success' });
            } catch (err) {
                console.error(`Error procesando usuario ${userId}:`, err);
                results.push({ user_id: userId, status: 'error', message: err.message });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: results.length,
                results
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error general en expire-trials:', error)
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
