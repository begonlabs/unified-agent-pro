import { createClient } from '@supabase/supabase-js';

// Configuration - Use env vars or fill them
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
    console.log('🔍 Buscando duplicados de Green API...');

    const { data: channels, error } = await supabase
        .from('communication_channels')
        .select('*')
        .eq('channel_type', 'whatsapp_green_api');

    if (error) {
        console.error('❌ Error fetching channels:', error);
        return;
    }

    const seen = new Map();
    const toDelete = [];

    for (const channel of channels) {
        const idInstance = channel.channel_config?.idInstance;
        const userId = channel.user_id;
        const key = `${userId}_${idInstance}`;

        if (seen.has(key)) {
            // Duplicado encontrado
            console.log(`🗑️ Duplicado encontrado: User ${userId}, Instance ${idInstance} (ID: ${channel.id})`);
            toDelete.push(channel.id);
        } else {
            seen.set(key, channel.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`♻️ Eliminando ${toDelete.length} duplicados...`);
        const { error: deleteError } = await supabase
            .from('communication_channels')
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error('❌ Error eliminando duplicados:', deleteError);
        } else {
            console.log('✅ Duplicados eliminados exitosamente');
        }
    } else {
        console.log('✨ No se encontraron duplicados.');
    }
}

cleanupDuplicates();
