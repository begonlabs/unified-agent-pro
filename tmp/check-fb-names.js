import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFacebookNames() {
  console.log('🔍 Buscando clientes de Facebook en la base de datos...\n');

  // Primero buscamos en crm_clients aquellos que parezcan ser de Facebook o no tengan nombre genérico
  // O podemos buscar primero las conversaciones de canal 'facebook'
  
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      channel,
      last_message_at,
      client_id,
      crm_clients (
        id,
        name,
        phone,
        email,
        platform_id
      )
    `)
    .eq('channel', 'facebook');

  if (convError) {
    console.error('Error querying conversations:', convError);
    return;
  }

  console.log(`Encontradas ${conversations.length} conversaciones de Facebook en total.`);

  let foundNames = [];

  for (const conv of conversations) {
    const client = conv.crm_clients;
    // Consideramos un nombre "correcto" si existe, no es nulo, y no es "Cliente Anónimo" u omitido
    if (client && client.name && client.name !== 'Cliente Anónimo' && client.name !== 'Usuario Desconocido' && client.name.trim() !== '') {
      
      // Obtener algunos mensajes de esta conversación para mostrar contexto
      const { data: messages } = await supabase
        .from('messages')
        .select('content, sender_type, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(3);

      foundNames.push({
        client_name: client.name,
        client_id: client.id,
        platform_id: client.platform_id,
        conversation_id: conv.id,
        last_message_at: conv.last_message_at,
        recent_messages: messages || []
      });
    }
  }

  if (foundNames.length > 0) {
    console.log(`\n✅ ¡ÉXITO! Se encontraron ${foundNames.length} usuarios de Facebook con nombre real guardado:\n`);
    foundNames.forEach((item, index) => {
      console.log(`--- Usuario ${index + 1} ---`);
      console.log(`Nombre: ${item.client_name}`);
      console.log(`Platform ID: ${item.platform_id || 'N/A'}`);
      console.log(`Última interacción: ${new Date(item.last_message_at).toLocaleString()}`);
      console.log(`Mensajes recientes:`);
      item.recent_messages.forEach(msg => {
        console.log(`  [${msg.sender_type}] ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      });
      console.log('');
    });
  } else {
    console.log('\n❌ RESULTADO: NO se encontró ningún nombre real guardado para clientes de Facebook.');
    console.log('Todos los registros de Facebook parecen estar como "Cliente Anónimo", cadenas vacías o sin registrar en crm_clients.');
  }
}

checkFacebookNames();
