const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/VITE_SERVICE_ROLE_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
  console.error("No se encontraron las credenciales en .env");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function disconnectInstagram() {
  console.log('Buscando el canal de Instagram específico...');
  
  const { data: channels, error: fetchError } = await supabase
    .from('communication_channels')
    .select('*')
    .in('channel_type', ['instagram', 'instagram_legacy']);
    
  if (fetchError) {
    console.error('Error buscando canales:', fetchError);
    return;
  }
  
  const targetChannel = channels.find(c => 
    c.channel_config && 
    c.channel_config.instagram_user_id === '17841474920367733'
  );
  
  if (!targetChannel) {
    console.log('❌ No se encontró el canal con ID 17841474920367733 vinculado a Instagram.');
    return;
  }
  
  console.log('Desconectando canal:', targetChannel.id);
  const { error: updateError } = await supabase
    .from('communication_channels')
    .update({ is_connected: false })
    .eq('id', targetChannel.id);
    
  if (updateError) {
    console.error('Error al desconectar:', updateError);
  } else {
    console.log('✅ ¡Canal desconectado exitosamente en la base de datos local!');
    console.log('Abre la página web local y verás que arriba de todo se dibuja la alerta roja "La conexión se ha perdido".');
  }
}

disconnectInstagram();
