import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
    plan_type: 'basico' | 'avanzado' | 'pro' | 'empresarial' | 'desarrollo_basico' | 'desarrollo_avanzado' | 'desarrollo_pro' | 'desarrollo_empresarial'
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
    desarrollo_basico: 1,
    desarrollo_avanzado: 1,
    desarrollo_pro: 1,
    desarrollo_empresarial: 1,
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
        const validPlans = ['basico', 'avanzado', 'pro', 'empresarial', 'desarrollo_basico', 'desarrollo_avanzado', 'desarrollo_pro', 'desarrollo_empresarial'];
        if (!validPlans.includes(plan_type)) {
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

        // Security check for $1 developer plans
        if (plan_type.startsWith('desarrollo_')) {
            const authorizedEmails = ['sarkispanosian@gmail.com', 'aramdermarkarian@gmail.com', 'paidmediatutak@gmail.com'];
            if (!user.email || !authorizedEmails.includes(user.email.toLowerCase())) {
                console.warn(`Unauthorized attempt to purchase developer plan by ${user.email}`);
                throw new Error('No estás autorizado para acceder a este plan de desarrollo.');
            }
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
        // GENERACIÓN DINÁMICA DE SUSCRIPCIONES (V1/PAYMENTS)
        // Restaura el funcionamiento original de redirección dinámica.
        // =====================================================================

        const returnUrl = `https://app.ondai.ai/dashboard?view=profile&tab=plans&verifying_payment=true`;

        const userCountry = user.user_metadata?.country?.toUpperCase() || 'UY';

        const dlocalgoPayment: any = {
            amount: amount,
            currency: 'USD',
            country: userCountry,
            payment_method_id: 'CARD', // Solo cobros por tarjeta
            payment_method_flow: 'REDIRECT', // Obliga el rebote a OndAI
            description: `Suscripción Mensual Plan ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)}`,
            callback_url: returnUrl,
            success_url: returnUrl,
            back_url: returnUrl,
            notification_url: `https://supabase.ondai.ai/functions/v1/payment-webhook`, // Must explicitly be the public internet URL
            payer: {
                name: '', // Empty delegates extraction to DLocal Go checkout form
                email: user.email!,
            },
            order_id: orderId,
            recurring: {
                frequency: 'MONTHLY',
                start_date: new Date().toISOString().split('T')[0], // Start today
            }
        };

        // Create Basic Auth header overriding the faulty Supabase Secrets Vault cache with Production keys permanently
        const PROD_API_KEY = 'eYyxWqcFvMoYDiMIwdyLhQZRERseoYOs';
        const PROD_SECRET_KEY = 'IZ5bAeH4XS2v3oNsC6pgBAvTjHngeOVdbGUk1MDP';
        const PROD_API_URL = 'https://api.dlocalgo.com';

        const authString = `${PROD_API_KEY}:${PROD_SECRET_KEY}`
        const authHeader = `Basic ${btoa(authString)}`

        console.log('Sending subscription request to dLocal Go API:', dlocalgoPayment);

        const dlocalgoResponse = await fetch(`${PROD_API_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(dlocalgoPayment),
        });

        if (!dlocalgoResponse.ok) {
            const errorText = await dlocalgoResponse.text()
            console.error('dLocalGo API error:', errorText)
            throw new Error(`dLocalGo API error: ${errorText}`)
        }

        const dlocalgoData = await dlocalgoResponse.json()
        console.log('dLocalGo API response:', dlocalgoData);

        // Enforce Spanish Language Interface upon the generated redirect URL natively
        const rawRedirectUrl = dlocalgoData.redirect_url || dlocalgoData.payment_url;
        const checkoutUrl = rawRedirectUrl.includes('?') 
            ? `${rawRedirectUrl}&lang=es` 
            : `${rawRedirectUrl}?lang=es`;

        console.log('Final Redirect URL with localized constraints:', checkoutUrl);

        // Update payment record with the expected info
        await supabase
            .from('payments')
            .update({
                dlocalgo_payment_id: dlocalgoData.id,
                payment_data: { type: 'api_payment_generated', checkoutUrl, api_response: dlocalgoData },
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
