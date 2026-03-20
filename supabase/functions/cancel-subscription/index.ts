import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = config.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = config.SUPABASE_SERVICE_ROLE_KEY
const DLOCALGO_API_KEY = config.DLOCALGO_API_KEY
const DLOCALGO_SECRET_KEY = config.DLOCALGO_SECRET_KEY
const DLOCALGO_API_URL = config.DLOCALGO_API_URL

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse request body
        const { user_id } = await req.json()

        if (!user_id) {
            throw new Error('user_id is required')
        }

        console.log('Cancelling subscription for user:', user_id)

        // 1. Get current active subscription/payment info
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single()

        if (profileError || !profile) {
            throw new Error('Profile not found')
        }

        // 2. Call dLocal Go API to cancel the subscription
        console.log('Fetching dLocal Go subscriptions to find active match...')
        const DLOCALGO_PLANS: Record<string, number> = {
            'basico': 18861,
            'avanzado': 18848,
            'pro': 18849,
            'empresarial': 18850,
            'test': 18861
        };

        const planId = DLOCALGO_PLANS[profile.plan_type] || 18861;
        const authString = btoa(`${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`);
        const authHeader = `Basic ${authString}`;

        try {
            const dlocalUrl = `${DLOCALGO_API_URL}/v1/subscription/plan/${planId}/subscription/all`;
            const subsResponse = await fetch(dlocalUrl, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });

            if (subsResponse.ok) {
                const subsData = await subsResponse.json();
                const userEmail = profile.email;

                // Match by email and active status
                const activeSub = subsData.data?.find((sub: any) => 
                    sub.client_email === userEmail && sub.active === true && (sub.status === 'CONFIRMED' || sub.status === 'ACTIVE')
                );

                if (activeSub) {
                    console.log('Found active subscription in dLocal:', activeSub.id);
                    const cancelUrl = `${DLOCALGO_API_URL}/v1/subscription/plan/${planId}/subscription/${activeSub.id}/cancel`;
                    const cancelResponse = await fetch(cancelUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!cancelResponse.ok) {
                        const err = await cancelResponse.text();
                        console.error('Failed to cancel in dLocal directly (POST /cancel):', err);
                        // Fallback to PATCH /deactivate just in case the endpoint name varies
                        const deactivateUrl = `${DLOCALGO_API_URL}/v1/subscription/plan/${planId}/subscription/${activeSub.id}/deactivate`;
                        await fetch(deactivateUrl, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': authHeader,
                                'Content-Type': 'application/json'
                            }
                        }).catch(e => console.error('Fallback deactivate failed:', e));
                    } else {
                        console.log('Successfully cancelled subscription in dLocal Go API');
                    }
                } else {
                    console.log('No active subscription found in dLocal API. Proceeding with local cancellation.');
                }
            } else {
                console.error('Failed to fetch subscriptions from dLocal API', await subsResponse.text());
            }
        } catch (dlocalError) {
            console.error('Error interacting with dLocal API during cancellation:', dlocalError);
            // We do not throw here to ensure the user is not trapped if dLocal API is down
        }

        // 3. Update local profile status
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                payment_status: 'cancelled',
                plan_type: 'none'
            })
            .eq('user_id', user_id)

        if (updateError) {
            throw new Error('Failed to update profile status')
        }

        // Also update subscriptions table
        await supabase
            .from('subscriptions')
            .update({ is_active: false })
            .eq('user_id', user_id)
            .eq('is_active', true)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Subscription cancelled successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error('Error cancelling subscription:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Unknown error',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
