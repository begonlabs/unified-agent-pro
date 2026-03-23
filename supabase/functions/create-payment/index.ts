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

        // =====================================================================
        // CONFIGURACIÓN DE PLANES Y TOKENS DE DLOCAL GO
        // =====================================================================
        const IS_TEST_MODE = false; // Modo Producción Activado con Planes Reales

        const TEST_PLAN_TOKENS = {
            basico: 'OQEWtkzyuGSX8DIDikUdrotOVdvkLAnp', // Plan de prueba actual (1 USD)
            avanzado: '7uuNsz8mSBHsTNqzSA9m2c6wHH0Oh2oc', // API Test Plan (1 USD)
            pro: 'nTPVxuGRB0khYVXvuCQ1iQqC3242qCvB',      // API Test Plan (1 USD)
            empresarial: 'PuoD9OzTE6YFnZ3Sp0cRg22wc01zx1Me', // API Test Plan (1 USD)
        }

        const PROD_PLAN_TOKENS = {
            basico: 'XLVQJpVkppEbf9uwknRCtq0bptgZb8Zt',
            avanzado: 'KS95pSSHXEzaUamZNHKogMeNQlicurJC',
            pro: '9hLZVKvxwnNfOPCw2CcBx4wJSsvBS5cV',
            empresarial: 'EeVAHdeOyo28CHNhXmMYQhGcuBBOB0fF',
        }

        // Select the dLocal Go subscription link token based on the plan type
        const activeTokens = IS_TEST_MODE ? TEST_PLAN_TOKENS : PROD_PLAN_TOKENS;
        const planToken = activeTokens[plan_type as keyof typeof activeTokens];

        if (!planToken || planToken.startsWith('TODO_')) {
            throw new Error(`Suscripción no configurada (Token faltante) para el plan: ${plan_type} en modo ${IS_TEST_MODE ? 'Pruebas' : 'Producción'}.`);
        }

        // Extract the user's registered country code if available, default to 'UY' (Uruguay) if missing
        const userCountry = user.user_metadata?.country || 'UY';

        // Generate the custom checkout URL with user data
        // We pass external_id to identify the user when the webhook fires, and country to force localization
        const checkoutUrl = `https://checkout.dlocalgo.com/validate/subscription/${planToken}?email=${encodeURIComponent(user.email || '')}&external_id=${user_id}&country=${userCountry}&lang=es`;

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
