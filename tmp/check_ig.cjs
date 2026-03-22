const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
    const [key, ...val] = line.split('=');
    if(key && val) acc[key.trim()] = val.join('=').trim();
    return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUserIG() {
    const { data: profile } = await supabase.from('profiles').select('user_id').eq('email', 'sarkispanosian@gmail.com').single();
    if (!profile) {
        console.log('User not found in profiles.');
        return;
    }
    console.log('User ID:', profile.user_id);
    
    // Check pages
    const { data: pages } = await supabase.from('pages').select('*').eq('user_id', profile.user_id);
    
    console.log('Pages/Channels found:', pages?.map(p => ({ 
        id: p.id, 
        platform: p.platform, 
        name: p.name, 
        instagram_account_id: p.instagram_account_id,
        is_active: p.is_active
    })) || 'none');
    
    let isConnected = false;

    if (pages && pages.length > 0) {
        const igPages = pages.filter(p => !!p.instagram_account_id || p.platform === 'instagram');
        if (igPages.length > 0) {
            console.log('Found Instagram connections in DB. Testing with Meta Graph API...');
            for (const p of igPages) {
                const igId = p.instagram_account_id || p.page_id;
                console.log('Testing IG Account ID:', igId);
                try {
                    const res = await fetch(`https://graph.facebook.com/v20.0/${igId}?access_token=${p.access_token}`);
                    const json = await res.json();
                    console.log('Meta API Response:', json);
                    if (!json.error) {
                        isConnected = true;
                        console.log('✅ INSTAGRAM IS ACTIVELY CONNECTED AND WORKING!');
                    } else {
                        console.log('❌ Token is invalid or account disconnected at Meta level.');
                    }
                } catch (e) {
                    console.error('Error fetching from Meta:', e);
                }
            }
        } else {
            console.log('No Instagram-specific information found in pages table.');
        }
    }
    
    console.log('Final Verdict: Is user connected to IG? ->', isConnected);
}

checkUserIG();
