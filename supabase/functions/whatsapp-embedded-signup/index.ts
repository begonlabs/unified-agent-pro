// whatsapp-embedded-signup/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: WhatsApp Business API Embedded Signup Handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  account_review_status: string;
  business_verification_status: string;
}

interface WhatsAppPhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST' || req.method === 'GET') {
      // Manejar tanto POST con JSON body como GET con query params (callback de OAuth)
      let code, state, userId;
      
      if (req.headers.get('content-type')?.includes('application/json')) {
        // POST con JSON body
        const body = await req.json();
        code = body.code;
        state = body.state;
        userId = body.userId;
      } else {
        // GET con query params (OAuth callback)
        const url = new URL(req.url);
        code = url.searchParams.get('code');
        state = url.searchParams.get('state');
      }

      // Extraer userId del state parameter si no se proporcionó directamente
      if (!userId && state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(state));
          userId = stateData.user_id;
        } catch (parseError) {
          console.warn('⚠️ No se pudo parsear el state parameter:', parseError);
        }
      }

      console.log('🚀 WhatsApp Embedded Signup - Processing authorization code:', {
        hasCode: !!code,
        hasState: !!state,
        userId: userId,
        method: req.method
      });

      if (!code || !userId) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing authorization code or user ID' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Environment variables
      const appId = Deno.env.get('WHATSAPP_APP_ID') || Deno.env.get('META_APP_ID')
      const appSecret = Deno.env.get('WHATSAPP_APP_SECRET') || Deno.env.get('META_APP_SECRET')
      const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v18.0'
      const webhookUrl = Deno.env.get('WHATSAPP_WEBHOOK_URL') || 'https://supabase.ondai.ai/functions/v1/whatsapp-webhook'
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

      if (!appId || !appSecret || !supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required environment variables',
            debug: {
              hasAppId: !!appId,
              hasAppSecret: !!appSecret,
              hasSupabaseUrl: !!supabaseUrl,
              hasServiceKey: !!supabaseServiceKey
            }
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Step 1: Exchange code for Business Integration System User token
      console.log('🔄 Step 1: Exchanging authorization code for access token...');
      const tokenResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/oauth/access_token`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            code: code
          }).toString()
        }
      )

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('❌ Token exchange failed:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Token exchange failed: ${errorText}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const tokenData = await tokenResponse.json()
      const businessIntegrationToken = tokenData.access_token

      if (!businessIntegrationToken) {
        console.error('❌ No access token received:', tokenData);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No access token received from Facebook' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Step 1 completed: Business Integration token obtained');

      // Step 2: Get user's WhatsApp Business Accounts
      console.log('🔄 Step 2: Fetching WhatsApp Business Accounts...');
      const wabaResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/me/whatsapp_business_accounts?access_token=${businessIntegrationToken}`
      )

      if (!wabaResponse.ok) {
        const errorText = await wabaResponse.text()
        console.error('❌ WABA fetch failed:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch WhatsApp Business Accounts: ${errorText}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const wabaData = await wabaResponse.json()
      const wabas = wabaData.data || []

      if (wabas.length === 0) {
        console.error('❌ No WhatsApp Business Accounts found');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No WhatsApp Business Accounts found for this user' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Use the first WABA (in production, you might want to let user choose)
      const selectedWaba = wabas[0]
      console.log('✅ Step 2 completed: WABA selected:', {
        id: selectedWaba.id,
        name: selectedWaba.name
      });

      // Step 3: Get WABA details
      console.log('🔄 Step 3: Fetching WABA details...');
      const wabaDetailsResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${selectedWaba.id}?` +
        `fields=name,account_review_status,business_verification_status&` +
        `access_token=${businessIntegrationToken}`
      )

      const wabaDetails: WhatsAppBusinessAccount = await wabaDetailsResponse.json()
      console.log('✅ Step 3 completed: WABA details fetched:', wabaDetails);

      // Step 4: Get phone numbers for this WABA
      console.log('🔄 Step 4: Fetching phone numbers...');
      const phoneNumbersResponse = await fetch(
        `https://graph.facebook.com/${graphVersion}/${selectedWaba.id}/phone_numbers?access_token=${businessIntegrationToken}`
      )

      if (!phoneNumbersResponse.ok) {
        const errorText = await phoneNumbersResponse.text()
        console.error('❌ Phone numbers fetch failed:', errorText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to fetch phone numbers: ${errorText}` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const phoneNumbersData = await phoneNumbersResponse.json()
      const phoneNumbers = phoneNumbersData.data || []

      if (phoneNumbers.length === 0) {
        console.error('❌ No phone numbers found for WABA');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No phone numbers found for this WhatsApp Business Account' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Use the first phone number
      const selectedPhoneNumber: WhatsAppPhoneNumber = phoneNumbers[0]
      console.log('✅ Step 4 completed: Phone number selected:', {
        id: selectedPhoneNumber.id,
        display_phone_number: selectedPhoneNumber.display_phone_number
      });

      // Step 5: Register phone number (if not already registered)
      console.log('🔄 Step 5: Registering phone number...');
      try {
        const registerResponse = await fetch(
          `https://graph.facebook.com/${graphVersion}/${selectedPhoneNumber.id}/register`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${businessIntegrationToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp'
            })
          }
        )

        if (registerResponse.ok) {
          console.log('✅ Step 5 completed: Phone number registered successfully');
        } else {
          const errorText = await registerResponse.text()
          console.log('⚠️ Step 5: Phone number might already be registered:', errorText);
          // Continue anyway, as this is not critical
        }
      } catch (registerError) {
        console.log('⚠️ Step 5: Phone number registration error (continuing anyway):', registerError);
      }

      // Step 6: Configure webhooks automatically
      console.log('🔄 Step 6: Configuring webhooks...');
      let webhookConfigured = false;
      try {
        // Subscribe to webhook events
        const webhookResponse = await fetch(
          `https://graph.facebook.com/${graphVersion}/${selectedWaba.id}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${businessIntegrationToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (webhookResponse.ok) {
          console.log('✅ Step 6 completed: Webhooks configured successfully');
          webhookConfigured = true;
        } else {
          const errorText = await webhookResponse.text()
          console.error('❌ Webhook configuration failed:', errorText);
          // Continue anyway, manual webhook setup can be done later
        }
      } catch (webhookError) {
        console.error('❌ Webhook configuration error:', webhookError);
      }

      // Step 7: Save to database
      console.log('🔄 Step 7: Saving configuration to database...');
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Check if WhatsApp channel already exists for this user
      const { data: existingChannel, error: checkError } = await supabase
        .from('communication_channels')
        .select('id')
        .eq('user_id', userId)
        .eq('channel_type', 'whatsapp')
        .maybeSingle();

      const channelConfig = {
        phone_number_id: selectedPhoneNumber.id,
        business_account_id: selectedWaba.id,
        access_token: businessIntegrationToken,
        display_phone_number: selectedPhoneNumber.display_phone_number,
        verified_name: selectedPhoneNumber.verified_name,
        business_name: wabaDetails.name,
        account_review_status: wabaDetails.account_review_status,
        business_verification_status: wabaDetails.business_verification_status,
        webhook_configured: webhookConfigured,
        webhook_url: webhookUrl,
        connected_at: new Date().toISOString()
      };

      let dbError;
      if (existingChannel) {
        // Update existing channel
        console.log('📝 Updating existing WhatsApp channel for user:', userId);
        const { error: updateError } = await supabase
          .from('communication_channels')
          .update({
            channel_config: channelConfig,
            is_connected: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingChannel.id);
        dbError = updateError;
      } else {
        // Create new channel
        console.log('📝 Creating new WhatsApp channel for user:', userId);
        const { error: insertError } = await supabase
          .from('communication_channels')
          .insert({
            user_id: userId,
            channel_type: 'whatsapp',
            channel_config: channelConfig,
            is_connected: true
          });
        dbError = insertError;
      }

      if (dbError) {
        console.error('❌ Database operation error:', dbError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Database error: ${dbError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('✅ Step 7 completed: Configuration saved to database');

      // Success response
      const responseData = {
        success: true,
        data: {
          businessName: wabaDetails.name,
          phoneNumber: selectedPhoneNumber.display_phone_number,
          wabaId: selectedWaba.id,
          phoneNumberId: selectedPhoneNumber.id,
          verifiedName: selectedPhoneNumber.verified_name,
          status: 'connected',
          webhookConfigured: webhookConfigured,
          accountReviewStatus: wabaDetails.account_review_status,
          businessVerificationStatus: wabaDetails.business_verification_status
        }
      };

      console.log('🎉 WhatsApp Embedded Signup completed successfully:', responseData.data);

      // Si es un GET request (OAuth callback), redirigir al frontend con éxito
      if (req.method === 'GET') {
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://ondai.ai';
        const redirectUrl = `${frontendUrl}/dashboard?success=true&channel=whatsapp&business_name=${encodeURIComponent(wabaDetails.name)}&phone_number=${encodeURIComponent(selectedPhoneNumber.display_phone_number)}`;
        
        return new Response(null, {
          status: 302,
          headers: {
            'Location': redirectUrl
          }
        });
      }

      // Si es un POST request, devolver JSON
      return new Response(
        JSON.stringify(responseData),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('❌ Critical error in whatsapp-embedded-signup:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Internal server error: ${error.message}`,
        debug: { 
          request_url: req.url,
          timestamp: new Date().toISOString()
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})