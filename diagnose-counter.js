
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_ equivalents) are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('--- Starting Diagnosis ---');
    console.log('URL:', supabaseUrl);
    console.log('Key provided:', !!supabaseKey);

    // 1. Check if we can connect and fetch a profile
    console.log('\n1. Testing connection and fetching a profile...');
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, messages_sent_this_month')
        .limit(1)
        .single();

    if (profileError) {
        console.error('❌ Error fetching profile:', profileError);
        return;
    }
    console.log('✅ Fetched profile:', profile);

    // 2. Check if the RPC function exists (by trying to call it)
    console.log('\n2. Testing increment_message_usage RPC...');
    const userId = profile.user_id;
    const initialCount = profile.messages_sent_this_month || 0;

    const { error: rpcError } = await supabase.rpc('increment_message_usage', {
        user_id_param: userId
    });

    if (rpcError) {
        console.error('❌ RPC call failed:', rpcError);
        console.error('Possible causes: Function does not exist, permissions issue, or parameter mismatch.');
    } else {
        console.log('✅ RPC call successful.');

        // 3. Verify the increment
        console.log('\n3. Verifying increment...');
        const { data: updatedProfile, error: verifyError } = await supabase
            .from('profiles')
            .select('messages_sent_this_month')
            .eq('user_id', userId)
            .single();

        if (verifyError) {
            console.error('❌ Error fetching updated profile:', verifyError);
        } else {
            const newCount = updatedProfile.messages_sent_this_month;
            console.log(`Old count: ${initialCount}, New count: ${newCount}`);
            if (newCount === initialCount + 1) {
                console.log('✅ Counter incremented successfully!');
            } else {
                console.error('❌ Counter did NOT increment correctly.');
            }
        }
    }
}

diagnose().catch(err => console.error('Unexpected error:', err));
