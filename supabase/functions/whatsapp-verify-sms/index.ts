// whatsapp-verify-sms/index.ts
// WhatsApp Cloud API SMS Code Verification Handler
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface VerifySMSRequest {
  verification_id: string;
  verification_code: string;
  user_id: string;
}

interface VerifySMSResponse {
  success: boolean;
  access_token?: string;
  phone_number_id?: string;
  business_account_id?: string;
  message?: string;
  error?: string;
}

// Create WhatsApp Business Account using Cloud API
async function createWhatsAppBusinessAccount(phoneNumber: string, config: Record<string, string>): Promise<Record<string, string>> {
  try {
    console.log('🚀 Creating WhatsApp Business Account via Cloud API for:', phoneNumber);

    // Step 1: Create Business Account
    const businessResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/me/businesses`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `WhatsApp Business - ${phoneNumber}`,
          timezone_id: '1', // UTC
          vertical: 'OTHER'
        })
      }
    );

    if (!businessResponse.ok) {
      const error = await businessResponse.text();
      console.error('Business creation failed:', error);
      throw new Error(`Business creation failed: ${error}`);
    }

    const businessData = await businessResponse.json();
    console.log('✅ Business created:', businessData.id);

    // Step 2: Create WhatsApp Business Account
    const wabaResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/${businessData.id}/whatsapp_business_accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `WABA - ${phoneNumber}`,
          timezone_id: '1'
        })
      }
    );

    if (!wabaResponse.ok) {
      const error = await wabaResponse.text();
      console.error('WABA creation failed:', error);
      throw new Error(`WABA creation failed: ${error}`);
    }

    const wabaData = await wabaResponse.json();
    console.log('✅ WABA created:', wabaData.id);

    // Step 3: Add phone number to WABA
    const phoneResponse = await fetch(
      `https://graph.facebook.com/${config.graphVersion}/${wabaData.id}/phone_numbers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified_name: `Business ${phoneNumber}`,
          display_phone_number: phoneNumber,
          phone_number: phoneNumber
        })
      }
    );

    if (!phoneResponse.ok) {
      const error = await phoneResponse.text();
      console.error('Phone number addition failed:', error);
      throw new Error(`Phone number addition failed: ${error}`);
    }

    const phoneData = await phoneResponse.json();
    console.log('✅ Phone number added:', phoneData.id);

    return {
      business_id: businessData.id,
      waba_id: wabaData.id,
      phone_number_id: phoneData.id,
      access_token: config.accessToken
    };

  } catch (error) {
    console.error('Error creating WhatsApp Business Account:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const body: VerifySMSRequest = await req.json()
    const { verification_id, verification_code, user_id } = body

    if (!verification_id || !verification_code || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: verification_id, verification_code, user_id' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('🔍 Verifying SMS code for verification_id:', verification_id);

    // Verify the SMS code
    const { data: verification, error: verifyError } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('id', verification_id)
      .eq('user_id', user_id)
      .eq('status', 'pending')
      .single();

    if (verifyError || !verification) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid verification ID or already used' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if verification has expired
    if (new Date(verification.expires_at) < new Date()) {
      await supabase
        .from('sms_verifications')
        .update({ status: 'expired' })
        .eq('id', verification_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification code has expired' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if code matches
    if (verification.verification_code !== verification_code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid verification code' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ SMS code verified successfully');

    // Mark verification as completed
    await supabase
      .from('sms_verifications')
      .update({ status: 'completed' })
      .eq('id', verification_id);

    // Get app access token for Cloud API
    const appId = Deno.env.get('WHATSAPP_APP_ID') || Deno.env.get('META_APP_ID');
    const appSecret = Deno.env.get('WHATSAPP_APP_SECRET') || Deno.env.get('META_APP_SECRET');
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v18.0';

    // Get app access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get app access token');
    }

    const tokenData = await tokenResponse.json();
    const appAccessToken = tokenData.access_token;

    // Create WhatsApp Business Account using Cloud API
    const whatsappConfig = {
      accessToken: appAccessToken,
      graphVersion: graphVersion
    };

    const wabaData = await createWhatsAppBusinessAccount(verification.phone_number, whatsappConfig);

    // Save to database
    const channelConfig = {
      phone_number_id: wabaData.phone_number_id,
      business_account_id: wabaData.waba_id,
      access_token: wabaData.access_token,
      display_phone_number: verification.phone_number,
      verified_name: `Business ${verification.phone_number}`,
      business_name: `WhatsApp Business - ${verification.phone_number}`,
      account_review_status: 'PENDING',
      business_verification_status: 'PENDING',
      webhook_configured: false,
      webhook_url: Deno.env.get('WHATSAPP_WEBHOOK_URL') || 'https://supabase.ondai.ai/functions/v1/whatsapp-webhook',
      phone_registered: true,
      connected_at: new Date().toISOString(),
      last_health_check: new Date().toISOString(),
      api_type: 'cloud' // Mark as Cloud API
    };

    // Check if channel already exists
    const { data: existingChannel } = await supabase
      .from('communication_channels')
      .select('id')
      .eq('user_id', user_id)
      .eq('channel_type', 'whatsapp')
      .single();

    if (existingChannel) {
      // Update existing channel
      await supabase
        .from('communication_channels')
        .update({
          channel_config: channelConfig,
          is_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingChannel.id);
    } else {
      // Create new channel
      await supabase
        .from('communication_channels')
        .insert({
          user_id: user_id,
          channel_type: 'whatsapp',
          channel_config: channelConfig,
          is_connected: true
        });
    }

    console.log('✅ WhatsApp Cloud API setup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        access_token: wabaData.access_token,
        phone_number_id: wabaData.phone_number_id,
        business_account_id: wabaData.waba_id,
        message: 'WhatsApp Cloud API setup completed successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in SMS verification:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
