// whatsapp-check-waba/index.ts
// Utility function to manually check WABA status after embedded signup
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CheckWABARequest {
  user_id: string;
  access_token?: string; // Optional - if provided, use this token
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

    const body: CheckWABARequest = await req.json()
    const { user_id, access_token } = body

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    console.log('🔍 Checking WABA status for user:', user_id);

    // Check if user already has a WhatsApp channel
    const { data: existingChannel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('user_id', user_id)
      .eq('channel_type', 'whatsapp')
      .single();

    let tokenToUse = access_token;
    
    if (existingChannel && !channelError) {
      console.log('✅ Found existing WhatsApp channel');
      tokenToUse = existingChannel.channel_config.access_token;
      
      return new Response(
        JSON.stringify({
          success: true,
          status: 'already_connected',
          data: {
            business_name: existingChannel.channel_config.business_name,
            phone_number: existingChannel.channel_config.display_phone_number,
            waba_id: existingChannel.channel_config.business_account_id,
            phone_number_id: existingChannel.channel_config.phone_number_id
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokenToUse) {
      return new Response(
        JSON.stringify({ 
          success: false,
          status: 'no_token',
          message: 'No access token available. Please restart the WhatsApp connection process.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Try to find WABAs with the provided token
    console.log('🔍 Searching for WABAs with provided token...');
    
    const graphVersion = Deno.env.get('META_GRAPH_VERSION') || 'v18.0';
    const appId = Deno.env.get('WHATSAPP_APP_ID') || Deno.env.get('META_APP_ID');
    
    // Try multiple approaches to find WABAs
    const approaches = [
      // Approach 1: Direct business accounts
      `https://graph.facebook.com/${graphVersion}/me/businesses?access_token=${tokenToUse}`,
      
      // Approach 2: Me accounts with type filter
      `https://graph.facebook.com/${graphVersion}/me/accounts?type=whatsapp_business_account&access_token=${tokenToUse}`,
      
      // Approach 3: App-level search
      `https://graph.facebook.com/${graphVersion}/${appId}?fields=whatsapp_business_accounts&access_token=${tokenToUse}`,
    ];

    let foundWabas: Array<{ id: string; name?: string }> = [];
    
    for (let i = 0; i < approaches.length; i++) {
      try {
        console.log(`🔍 WABA search approach ${i + 1}/${approaches.length}:`, approaches[i]);
        
        const response = await fetch(approaches[i]);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Approach ${i + 1} response:`, JSON.stringify(data, null, 2));
          
          // Extract WABAs from different response structures
          if (data.data) {
            // For businesses or accounts endpoints
            foundWabas = data.data;
          } else if (data.whatsapp_business_accounts) {
            // For app-level endpoint
            foundWabas = data.whatsapp_business_accounts.data || [];
          }
          
          if (foundWabas.length > 0) {
            console.log(`✅ Found ${foundWabas.length} WABA(s) with approach ${i + 1}`);
            break;
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Approach ${i + 1} failed:`, response.status, errorText);
        }
      } catch (error) {
        console.log(`❌ Approach ${i + 1} error:`, error.message);
      }
    }

    if (foundWabas.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          status: 'no_waba_found',
          message: 'No WhatsApp Business Accounts found. This usually means:\n\n' +
                  '1. Meta is still processing your account (wait 2-5 minutes)\n' +
                  '2. The Embedded Signup process wasn\'t completed\n' +
                  '3. Check Meta Business Manager for your WABA\n\n' +
                  'Please try connecting again in a few minutes.',
          suggestions: [
            'Wait 2-5 minutes and try again',
            'Check https://business.facebook.com for your WhatsApp account',
            'Ensure you completed all steps in the WhatsApp setup dialog',
            'Verify your Meta Business Manager settings'
          ]
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If we found WABAs, get details of the first one
    const firstWaba = foundWabas[0];
    
    // Get WABA details
    const wabaDetailsResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${firstWaba.id}?fields=name,account_review_status,business_verification_status&access_token=${tokenToUse}`
    );
    
    let wabaDetails = firstWaba;
    if (wabaDetailsResponse.ok) {
      wabaDetails = await wabaDetailsResponse.json();
    }
    
    // Get phone numbers
    const phoneResponse = await fetch(
      `https://graph.facebook.com/${graphVersion}/${firstWaba.id}/phone_numbers?access_token=${tokenToUse}`
    );
    
    let phoneNumbers: Array<{ id: string; display_phone_number: string; verified_name: string; status: string }> = [];
    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      phoneNumbers = phoneData.data || [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'waba_found',
        data: {
          waba_id: firstWaba.id,
          business_name: wabaDetails.name || firstWaba.name,
          account_review_status: wabaDetails.account_review_status,
          business_verification_status: wabaDetails.business_verification_status,
          phone_numbers: phoneNumbers.map(phone => ({
            id: phone.id,
            display_phone_number: phone.display_phone_number,
            verified_name: phone.verified_name,
            status: phone.status
          })),
          next_steps: phoneNumbers.length > 0 ? 
            'Ready to complete setup automatically' : 
            'Phone number configuration needed'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in whatsapp-check-waba:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        status: 'error',
        message: 'Internal server error: ' + error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
