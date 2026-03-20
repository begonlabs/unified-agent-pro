const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://supabase.ondai.ai';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTQzMzc2MDAsImV4cCI6MTkxMjEwNDAwMH0.ApXS8AfpwyHOtDmkrge18dFoBUZCnJIpSD7xF8O8IeQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ crm_level: 'none' })
    .eq('plan_type', 'basico');
  
  if (error) {
    console.error('Error updating profiles:', error);
  } else {
    console.log('Profiles fixed successfully.');
  }
}

fix();
