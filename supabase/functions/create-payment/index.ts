import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
    plan_type: 'basico' | 'avanzado' | 'pro'
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
    pro: 399,
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
        const { plan_type, user_id }: PaymentRequest = await req.json()

        // Validate plan type
        if (!['basico', 'avanzado', 'pro'].includes(plan_type)) {
            throw new Error('Invalid plan type')
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single()

        if (profileError || !profile) {
            throw new Error('User profile not found')
        }

        // Get user auth data
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(user_id)

        if (userError || !user) {
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
            throw new Error('Failed to create payment record')
        }

        // Prepare dLocalGo payment request
        // Use user's country from profile, fallback to UY if not set
        const dlocalgoPayment: DLocalGoPaymentRequest = {
            amount: amount,
            currency: 'USD',
            country: profile.country || 'UY', // Use profile country or default to Uruguay
            payment_method_id: 'CARD',
            payment_method_flow: 'REDIRECT',
            payer: {
                name: profile.company_name,
                email: user.email!,
            },
            order_id: orderId,
            notification_url: `${SUPABASE_URL}/functions/v1/payment-webhook`,
            callback_url: `${PUBLIC_URL}/dashboard?tab=profile&payment_success=true`,
        }


        console.log('Creating dLocalGo payment:', dlocalgoPayment)

        // Create Basic Auth header
        const authString = `${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`
        const authHeader = `Basic ${btoa(authString)}`

        // Create payment with dLocalGo
        const dlocalgoResponse = await fetch(`${DLOCALGO_API_URL}/v1/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(dlocalgoPayment),
        })

        if (!dlocalgoResponse.ok) {
            const errorText = await dlocalgoResponse.text()
            console.error('dLocalGo API error:', errorText)
            throw new Error(`dLocalGo API error: ${errorText}`)
        }

        const dlocalgoData = await dlocalgoResponse.json()
        console.log('dLocalGo response:', dlocalgoData)

        // Update payment record with dLocalGo payment ID
        await supabase
            .from('payments')
            .update({
                dlocalgo_payment_id: dlocalgoData.id,
                payment_data: dlocalgoData,
            })
            .eq('id', payment.id)

        // Return payment URL for redirect
        return new Response(
            JSON.stringify({
                success: true,
                payment_id: payment.id,
                payment_url: dlocalgoData.redirect_url || dlocalgoData.payment_url,
                dlocalgo_payment_id: dlocalgoData.id,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error in create-payment function:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
