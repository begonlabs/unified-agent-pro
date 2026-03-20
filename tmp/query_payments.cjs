const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if (key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const serviceKey = env.VITE_SERVICE_ROLE_KEY || 'MISSING';
if (serviceKey === 'MISSING') console.log('WARNING: Missing service key in .env');
const supabase = createClient(env.VITE_SUPABASE_URL, serviceKey);

async function check() {
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'test5sarkis@gmail.com').single();
    if (!profile) return console.log('Profile not found');
    const paymentId = '2b86073e-4f91-4cd9-b562-00629d381bc5';
    const { data, error } = await supabase.from('payments').select('*').eq('id', paymentId).single();
    console.log('Payment:', JSON.stringify(data, null, 2));
    if(error) console.log('Error:', error);
}

check();
