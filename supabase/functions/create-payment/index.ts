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
    basico: 1, // Reducido temporalmente a 1 USD para pruebas de redirección
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
        // GENERACIÓN DINÁMICA DE SUSCRIPCIONES (V1/PAYMENTS)
        // Restaura el funcionamiento original de redirección dinámica.
        // =====================================================================

        // Extract the user's registered country code.
        // DLocal Go strictly requires ISO 3166-1 alpha-2 (e.g., "AR", "CO", "UY").
        // If the database has a full name like "Argentina", fallback to UY to prevent 400 Bad Request.
        let rawCountry = (user.user_metadata?.country || 'UY').toUpperCase().trim();
        const userCountry = rawCountry.length === 2 ? rawCountry : 'UY';

        const dlocalgoPayment = {
            amount: amount,
            currency: 'USD',
            country: userCountry,
            description: `Suscripción Mensual Plan ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)}`,
            callback_url: `https://app.ondai.ai/dashboard?view=profile&tab=plans`, // Redirect after success cleanly
            notification_url: `${SUPABASE_URL}/functions/v1/payment-webhook`,
            payer: {
                name: profile.name || user.email?.split('@')[0] || 'Customer',
                email: user.email!,
                document: user.user_metadata?.document || '12345678', // Required for some regions
            },
            order_id: orderId,
            recurring: {
                frequency: 'MONTHLY',
                start_date: new Date().toISOString().split('T')[0], // Start today
            }
        };

        // Create Basic Auth header
        const authString = `${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`
        const authHeader = `Basic ${btoa(authString)}`

        console.log('Sending subscription request to dLocal Go API:', dlocalgoPayment);

        const dlocalgoResponse = await fetch(`${DLOCALGO_API_URL}/v1/payments`, {
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
