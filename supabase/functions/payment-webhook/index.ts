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
        } else if (webhookPayload.invoiceId && webhookPayload.subscriptionId) {
            // DLocal Go Subscription Invoice Webhook
            console.log('Received subscription invoice webhook:', webhookPayload.invoiceId);
            paymentData = webhookPayload;
            dlocalgoPaymentId = webhookPayload.invoiceId;
        } else {
            // DEBUG: Save rogue payload to logs/payments just in case
            try {
                await supabase.from('payments').insert({
                    user_id: '00000000-0000-0000-0000-000000000000', // invalid to ensure it falls through
                    status: 'failed',
                    currency: 'HCK',
                    payment_data: webhookPayload,
                    plan_type: 'basico'
                });
            } catch (e) {
                console.error('Failed to log rogue payload', e);
            }

            throw new Error('Invalid webhook payload format')
        }

        // Extraer email o id externo del payer para machar el cobro
        const buyerEmail = paymentData.payer?.email || paymentData.email || '';
        const externalId = paymentData.external_id || paymentData.order_id || '';

        // Find payment record
        // Primero intentamos por el id directo por si es un pago normal
        let { data: payment, error: paymentError } = await supabase
            .from('payments')
            .select('*')
            .eq('dlocalgo_payment_id', dlocalgoPaymentId)
            .single()

        // Si no se encuentra (porque es un Smart Link de Suscripción que se generó externo),
        // buscamos un pago 'pending' reciente que coincida con el email o el externalId
        if (paymentError || !payment) {
            console.log('Payment not found by dlocalgo_payment_id. Searching by email or external_id...', { buyerEmail, externalId });
            
            let targetUserId = null;
            
            if (externalId && externalId.length > 20) {
                targetUserId = externalId;
            } else if (buyerEmail) {
                const { data: profileByEmail } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('email', buyerEmail)
                    .single();
                    
                if (profileByEmail) {
                     targetUserId = profileByEmail.user_id;
                }
            }
            
            if (targetUserId) {
                let query = supabase
                    .from('payments')
                    .select('*')
                    .eq('status', 'pending')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false })
                    .limit(1);
                    
                const { data: pendingPayments } = await query;
                
                if (pendingPayments && pendingPayments.length > 0) {
                    payment = pendingPayments[0];
                    console.log('Found matching pending payment:', payment.id);
                    
                    // Ligar el ID de la transacción al registro
                    await supabase
                        .from('payments')
                        .update({ dlocalgo_payment_id: dlocalgoPaymentId })
                        .eq('id', payment.id);
                }
            }
        }

        if (!payment) {
            console.error('Payment not found globally. Orphan payment:', dlocalgoPaymentId)
            // Si todo falla, metemos el pago como huérfano para no reventar el webhook y poder inspeccionarlo
            try {
                await supabase.from('payments').insert({
                    user_id: '00000000-0000-0000-0000-000000000000', // invalid uuid will fail if constraint exists
                    currency: paymentData.currency || 'USD',
                    amount: paymentData.amount || 0,
                    status: 'approved',
                    dlocalgo_payment_id: dlocalgoPaymentId,
                    payment_data: paymentData,
                    plan_type: 'basico' // fallback
                });
            } catch (e: any) {
                console.error('Failed to save orphan payment safely', e);
            }

            throw new Error('Payment not found in database')
        }

        // Map dLocalGo status to our status
        let newStatus = 'pending'
        if (paymentData.status === 'PAID' || paymentData.status === 'APPROVED' || (paymentData.invoiceId && paymentData.subscriptionId)) {
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
            console.log('Plan type:', payment.plan_type)

            // Call the activate_paid_plan function
            const { error: activateError } = await supabase.rpc('activate_paid_plan', {
                p_user_id: payment.user_id,
                p_plan_type: payment.plan_type,
                p_payment_id: payment.id,
            })

            if (activateError) {
                console.error('Error activating plan:', activateError)
                console.error('Full error details:', JSON.stringify(activateError))
                throw new Error(`Failed to activate plan: ${activateError.message}`)
            }

            // Verify that limits were set correctly
            const { data: updatedProfile, error: profileError } = await supabase
                .from('profiles')
                .select('messages_limit, clients_limit, plan_type, has_statistics, crm_level')
                .eq('user_id', payment.user_id)
                .single()

            if (profileError) {
                console.error('Error fetching updated profile:', profileError)
            } else {
                console.log('Plan activated successfully. Profile limits:', updatedProfile)

                // Verify limits match expected values for the plan
                const expectedLimits = {
                    basico: { messages: 10000, clients: 500 },
                    avanzado: { messages: 30000, clients: 600 },
                    pro: { messages: 70000, clients: 2000 },
                    empresarial: { messages: 100000, clients: 3000 }
                }

                const expected = expectedLimits[payment.plan_type as keyof typeof expectedLimits]
                if (expected && updatedProfile.messages_limit !== expected.messages) {
                    console.error(`CRITICAL: Message limit mismatch! Expected ${expected.messages}, got ${updatedProfile.messages_limit}`)
                    console.log('Attempting to fix limits directly...')

                    // Fallback: Try to call configure_plan_limits directly
                    const { error: configError } = await supabase.rpc('configure_plan_limits', {
                        p_user_id: payment.user_id,
                        p_plan_type: payment.plan_type
                    })

                    if (configError) {
                        console.error('Failed to configure limits via RPC:', configError)
                        // Last resort: Direct update
                        const { error: directUpdateError } = await supabase
                            .from('profiles')
                            .update({
                                messages_limit: expected.messages,
                                clients_limit: expected.clients,
                                has_statistics: payment.plan_type === 'avanzado' || payment.plan_type === 'pro' || payment.plan_type === 'empresarial',
                                crm_level: payment.plan_type === 'basico' ? 'none' : 'complete',
                                updated_at: new Date().toISOString()
                            })
                            .eq('user_id', payment.user_id)

                        if (directUpdateError) {
                            console.error('FATAL: Failed to set limits even with direct update:', directUpdateError)
                        } else {
                            console.log('Successfully set limits via direct update')
                        }
                    } else {
                        console.log('Successfully configured limits via fallback RPC')
                    }
                }
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

            // Auto-provision Green API instance
            try {
                console.log('Auto-provisioning Green API instance...')
                const functionResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-green-api-instance`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: payment.user_id,
                        plan_type: payment.plan_type
                    })
                })

                if (functionResponse.ok) {
                    console.log('✅ Green API instance provisioned automatically')
                } else {
                    const errorText = await functionResponse.text()
                    console.error('❌ Failed to auto-provision Green API instance:', errorText)
                }
            } catch (provisionError) {
                console.error('❌ Error during auto-provisioning:', provisionError)
            }
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
    } catch (error: any) {
        console.error('Error processing webhook:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || String(error),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
