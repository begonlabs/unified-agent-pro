import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
    plan_type: 'basico' | 'avanzado' | 'pro' | 'empresarial'
    user_id: string
}

interface DLocalGoPaymentRequest {
    amount: number
    currency: string
    country: string
    payment_method_id: string
    payment_method_flow: string
    payer: {
        name: string
        email: string
    }
    order_id: string
    notification_url: string
    callback_url: string
}

const PLAN_PRICES = {
    basico: 49,
    avanzado: 139,
    pro: 299,
    empresarial: 399,
}

const DLOCALGO_API_KEY = config.DLOCALGO_API_KEY
const DLOCALGO_SECRET_KEY = config.DLOCALGO_SECRET_KEY
const DLOCALGO_API_URL = config.DLOCALGO_API_URL
const SUPABASE_URL = config.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = config.SUPABASE_SERVICE_ROLE_KEY
const PUBLIC_URL = config.PUBLIC_URL

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse request body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            throw new Error('Invalid JSON body');
        }

        const { plan_type, user_id }: PaymentRequest = body;

        console.log('Payment request received:', { plan_type, user_id });

        // Validate plan type
        if (!['basico', 'avanzado', 'pro', 'empresarial'].includes(plan_type)) {
            throw new Error(`Invalid plan type: ${plan_type}`)
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single()

        if (profileError || !profile) {
            console.error('Profile error:', profileError);
            throw new Error('User profile not found')
        }

        // Get user auth data
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id)

        if (userError || !user) {
            console.error('User error:', userError);
            throw new Error('User not found')
        }

        // Calculate amount
        const amount = PLAN_PRICES[plan_type]

        // Generate unique order ID
        const orderId = `order_${user_id}_${Date.now()}`

        // Create payment record in database
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                user_id,
                plan_type,
                amount,
                currency: 'USD',
                status: 'pending',
            })
            .select()
            .single()

        if (paymentError) {
            console.error('Error creating payment record:', paymentError)
            throw new Error('Failed to create payment record: ' + paymentError.message)
        }

        // Select the dLocal Go subscription link token based on the plan type
        // Currently we only have the test one for 'basico' (created via API to ensure webhooks)
        let planToken = '';
        if (plan_type === 'basico' || (plan_type as string) === 'test') { // fallback for testing
            planToken = 'OQEWtkzyuGSX8DIDikUdrotOVdvkLAnp';
        } else {
            throw new Error('Suscripción no configurada para este plan en dLocal Go todavía.');
        }

        // Generate the custom checkout URL with user data
        // We pass external_id to identify the user when the webhook fires
        const checkoutUrl = `https://checkout.dlocalgo.com/validate/subscription/${planToken}?email=${encodeURIComponent(user.email || '')}&external_id=${user_id}&lang=es&locale=es`;

        console.log('Generated subscription link:', checkoutUrl);

        // Update payment record with the expected info
        await supabase
            .from('payments')
            .update({
                payment_data: { type: 'subscription_link_generated', checkoutUrl },
            })
            .eq('id', payment.id)

        // Return payment URL for redirect
        return new Response(
            JSON.stringify({
                success: true,
                payment_id: payment.id,
                payment_url: checkoutUrl,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: any) {
        console.error('Error in create-payment function:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Unknown error',
                details: error.toString()
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
