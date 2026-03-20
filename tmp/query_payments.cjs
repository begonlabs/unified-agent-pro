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
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', 'test.plan.gratis.sarkis@gmail.com').single();
    if (!profile) return console.log('Profile not found');
    const { data: userPayments, error } = await supabase.from('payments').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false }).limit(5);
    console.log('Payments:', JSON.stringify(userPayments, null, 2));
    if(error) console.log('Error:', error);
}

check();
