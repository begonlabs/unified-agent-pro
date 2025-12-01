import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { config } from '../_shared/config.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscriptionStatus {
    is_trial: boolean
    trial_expired: boolean
    has_active_plan: boolean
    plan_type: string
    payment_status: string
    permissions: {
        whatsapp: boolean
        facebook: boolean
        instagram: boolean
        max_whatsapp_channels: number
        max_channels: number
    }
    trial_days_remaining?: number
}

const SUPABASE_URL = config.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = config.SUPABASE_SERVICE_ROLE_KEY

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get user_id from query params or body
        const url = new URL(req.url)
        const userId = url.searchParams.get('user_id') || (await req.json()).user_id

        if (!userId) {
            throw new Error('user_id is required')
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (profileError || !profile) {
            throw new Error('User profile not found')
        }

        // Check if trial has expired
        const now = new Date()
        const trialEndDate = profile.trial_end_date ? new Date(profile.trial_end_date) : null
        const trialExpired = profile.is_trial && trialEndDate && trialEndDate < now

        // Calculate trial days remaining
        let trialDaysRemaining = 0
        if (profile.is_trial && trialEndDate) {
            const diffTime = trialEndDate.getTime() - now.getTime()
            trialDaysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            trialDaysRemaining = Math.max(0, trialDaysRemaining)
        }

        // Determine permissions based on plan
        let permissions = {
            whatsapp: false,
            facebook: false,
            instagram: false,
            max_whatsapp_channels: 0,
            max_channels: 0,
        }

        if (profile.is_trial && !trialExpired) {
            // Trial period: FB and IG only, no WhatsApp
            permissions = {
                whatsapp: false,
                facebook: true,
                instagram: true,
                max_whatsapp_channels: 0,
                max_channels: 2,
            }
        } else if (profile.payment_status === 'active') {
            // Active paid plan
            switch (profile.plan_type) {
                case 'basico':
                    permissions = {
                        whatsapp: true,
                        facebook: true,
                        instagram: true,
                        max_whatsapp_channels: 1,
                        max_channels: 3,
                    }
                    break
                case 'avanzado':
                    permissions = {
                        whatsapp: true,
                        facebook: true,
                        instagram: true,
                        max_whatsapp_channels: 3,
                        max_channels: 6,
                    }
                    break
                case 'pro':
                    permissions = {
                        whatsapp: true,
                        facebook: true,
                        instagram: true,
                        max_whatsapp_channels: -1, // unlimited
                        max_channels: -1, // unlimited
                    }
                    break
            }
        }

        const status: SubscriptionStatus = {
            is_trial: profile.is_trial,
            trial_expired: trialExpired,
            has_active_plan: profile.payment_status === 'active',
            plan_type: profile.plan_type,
            payment_status: profile.payment_status,
            permissions,
            trial_days_remaining: profile.is_trial ? trialDaysRemaining : undefined,
        }

        return new Response(
            JSON.stringify({
                success: true,
                status,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error verifying subscription:', error)
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
