import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Parse webhook payload
        const webhook: DLocalGoWebhook = await req.json()

        console.log('Received dLocalGo webhook:', webhook)

        // Validate webhook type
        if (!webhook.type || !webhook.data) {
            throw new Error('Invalid webhook payload')
        }

        const paymentData = webhook.data
        const dlocalgoPaymentId = paymentData.id

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
