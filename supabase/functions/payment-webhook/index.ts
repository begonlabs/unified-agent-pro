import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DLocalGoWebhook {
    id: string
    type: string
    data: {
        id: string
        amount: number
        currency: string
        status: string
        order_id: string
        payment_method_id: string
        payment_method_type: string
        created_date: string
        approved_date?: string
        status_detail?: string
        status_code?: string
    }
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

        // Parse webhook payload
        const webhookPayload = await req.json()

        console.log('Received dLocalGo webhook:', webhookPayload)

        // dLocalGo sends different payload formats
        // Sometimes just { payment_id: "DP-123" }, sometimes full payload
        let dlocalgoPaymentId: string
        let paymentData: any

        if (webhookPayload.payment_id) {
            // Simple format: just payment_id
            dlocalgoPaymentId = webhookPayload.payment_id

            // Fetch payment details from dLocalGo API
            console.log('Fetching payment details from dLocalGo API:', dlocalgoPaymentId)

            const authString = `${DLOCALGO_API_KEY}:${DLOCALGO_SECRET_KEY}`
            const authHeader = `Basic ${btoa(authString)}`

            const dlocalgoResponse = await fetch(`${DLOCALGO_API_URL}/v1/payments/${dlocalgoPaymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                },
            })

            if (!dlocalgoResponse.ok) {
                const errorText = await dlocalgoResponse.text()
                console.error('dLocalGo API error:', errorText)
                throw new Error(`Failed to fetch payment details: ${errorText}`)
            }

            paymentData = await dlocalgoResponse.json()
            console.log('Fetched payment data:', paymentData)
        } else if (webhookPayload.type && webhookPayload.data) {
            // Full format: { type: "...", data: { ... } }
            paymentData = webhookPayload.data
            dlocalgoPaymentId = paymentData.id
        } else {
            throw new Error('Invalid webhook payload format')
        }

        // Find payment record
        const { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('dlocalgo_payment_id', dlocalgoPaymentId)
            .single()

        if (paymentError || !payment) {
            console.error('Payment not found:', dlocalgoPaymentId)
            throw new Error('Payment not found')
        }

        // Map dLocalGo status to our status
        let newStatus = 'pending'
        if (paymentData.status === 'PAID' || paymentData.status === 'APPROVED') {
            newStatus = 'approved'
        } else if (paymentData.status === 'REJECTED' || paymentData.status === 'CANCELLED') {
            newStatus = 'rejected'
        } else if (paymentData.status === 'CANCELLED') {
            newStatus = 'cancelled'
        }

        // Update payment record
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: newStatus,
                payment_method: paymentData.payment_method_type,
                payment_data: paymentData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

        if (updateError) {
            console.error('Error updating payment:', updateError)
            throw new Error('Failed to update payment')
        }

        // If payment approved, activate the plan
        if (newStatus === 'approved') {
            console.log('Payment approved, activating plan for user:', payment.user_id)

            // Call the activate_paid_plan function
            const { error: activateError } = await supabase.rpc('activate_paid_plan', {
                p_user_id: payment.user_id,
                p_plan_type: payment.plan_type,
                p_payment_id: payment.id,
            })

            if (activateError) {
                console.error('Error activating plan:', activateError)
                throw new Error('Failed to activate plan')
            }

            // Get user email for confirmation
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, company_name')
                .eq('user_id', payment.user_id)
                .single()

            if (profile) {
                // Send confirmation email
                try {
                    await supabase.functions.invoke('send-email', {
                        body: {
                            to: profile.email,
                            subject: '¡Pago confirmado! Tu plan ha sido activado',
                            html: `
                <h1>¡Gracias por tu pago!</h1>
                <p>Hola ${profile.company_name},</p>
                <p>Tu pago de $${payment.amount} USD ha sido procesado exitosamente.</p>
                <p><strong>Plan activado:</strong> ${payment.plan_type.charAt(0).toUpperCase() + payment.plan_type.slice(1)}</p>
                <p>Ya puedes disfrutar de todas las funcionalidades de tu plan.</p>
                <p>¡Gracias por confiar en nosotros!</p>
              `,
                        },
                    })
                } catch (emailError) {
                    console.error('Error sending confirmation email:', emailError)
                    // Don't throw error, email is not critical
                }
            }

            console.log('Plan activated successfully for user:', payment.user_id)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Webhook processed successfully',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error processing webhook:', error)
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
