const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if(key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function simulate() {
    console.log('Invoking create-payment for test5sarkis (fe7ec512-d4bd-4618-a271-e15e60cafed6)...');
    
    // We don't have the user's session, so we can't use supabase.functions.invoke directly easily if it requires auth.
    // Wait, let's just make a POST request with the anon key as Authorization.
    const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/create-payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            plan_type: 'basico',
            user_id: 'fe7ec512-d4bd-4618-a271-e15e60cafed6'
        })
    });
    
    const text = await res.text();
    console.log('Response status:', res.status);
    console.log('Response body:', text);
}

simulate();
