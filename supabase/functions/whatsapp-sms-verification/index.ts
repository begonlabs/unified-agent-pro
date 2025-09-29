// whatsapp-sms-verification/index.ts
// WhatsApp Cloud API SMS Verification Handler
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface SMSVerificationRequest {
  phone_number: string;
  country_code: string;
  user_id: string;
}

interface SMSVerificationResponse {
  success: boolean;
  verification_id?: string;
  message?: string;
  error?: string;
}

// Generate a 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS using a third-party service (Twilio, AWS SNS, etc.)
async function sendSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    // Using Twilio as example - replace with your SMS provider
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('Missing Twilio configuration');
      return false;
    }

    const message = `Tu código de verificación para WhatsApp es: ${code}. Válido por 10 minutos.`;
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': phoneNumber,
          'From': twilioPhoneNumber,
          'Body': message
        })
      }
    );

    if (response.ok) {
      console.log('SMS sent successfully to:', phoneNumber);
      return true;
    } else {
      const error = await response.text();
      console.error('SMS sending failed:', error);
      return false;
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
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

    const body: SMSVerificationRequest = await req.json()
    const { phone_number, country_code, user_id } = body

    if (!phone_number || !country_code || !user_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: phone_number, country_code, user_id' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationId = crypto.randomUUID();
    const fullPhoneNumber = `+${country_code}${phone_number}`;

    console.log('🔐 Starting SMS verification for:', fullPhoneNumber);

    // Store verification data temporarily (expires in 10 minutes)
    const { error: storeError } = await supabase
      .from('sms_verifications')
      .insert({
        id: verificationId,
        user_id: user_id,
        phone_number: fullPhoneNumber,
        verification_code: verificationCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        status: 'pending'
      });

    if (storeError) {
      console.error('Error storing verification:', storeError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to store verification data' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send SMS
    const smsSent = await sendSMS(fullPhoneNumber, verificationCode);

    if (!smsSent) {
      // Clean up stored data if SMS failed
      await supabase
        .from('sms_verifications')
        .delete()
        .eq('id', verificationId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send SMS verification code' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ SMS verification code sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        verification_id: verificationId,
        message: 'SMS verification code sent successfully'
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
