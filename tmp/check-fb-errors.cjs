const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkErrors() {
  const { data, error } = await supabase
    .from('crm_clients')
    .select('name, metadata')
    .like('name', 'Facebook User%')
    .not('metadata->>profile_fetch_error', 'is', null)
    .limit(3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- ERRORES DE FACEBOOK ENCONTRADOS ---');
  data.forEach((client, idx) => {
    console.log(`\nClient ${idx + 1}: ${client.name}`);
    console.log(`Error:`, client.metadata.profile_fetch_error);
  });
}

checkErrors();
