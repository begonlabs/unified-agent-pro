const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.ondai.ai';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTQzMzc2MDAsImV4cCI6MTkxMjEwNDAwMH0.ApXS8AfpwyHOtDmkrge18dFoBUZCnJIpSD7xF8O8IeQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('communication_channels')
    .select('id, user_id, channel_type, is_connected, channel_config')
    .eq('is_connected', false)
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
