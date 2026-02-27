
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.ondai.ai';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTQzMzc2MDAsImV4cCI6MTkxMjEwNDAwMH0.ApXS8AfpwyHOtDmkrge18dFoBUZCnJIpSD7xF8O8IeQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('🧹 Iniciando limpieza de canales duplicados...');

    const { data: channels, error } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('channel_type', 'whatsapp_green_api');

    if (error) {
        console.error('❌ Error al obtener canales:', error);
        return;
    }

    console.log(`📊 Encontrados ${channels.length} canales de Green API`);

    const groups = {};
    channels.forEach(ch => {
        const idInstance = ch.channel_config.idInstance;
        const userId = ch.user_id;
        const key = `${userId}_${idInstance}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(ch);
    });

    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            console.log(`⚠️ Encontrados ${group.length} duplicados para ${key}`);
            // Sort by created_at descending, keep the latest one
            group.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            const latest = group[0];
            const duplicates = group.slice(1);

            console.log(`✅ Manteniendo canal: ${latest.id}`);

            for (const dup of duplicates) {
                console.log(`🗑️ Eliminando duplicado: ${dup.id}`);
                const { error: delError } = await supabase
                    .from('communication_channels')
                    .delete()
                    .eq('id', dup.id);

                if (delError) {
                    console.error(`❌ Error al eliminar ${dup.id}:`, delError);
                }
            }
        }
    }

    console.log('✨ Limpieza completada.');
}

cleanup();
