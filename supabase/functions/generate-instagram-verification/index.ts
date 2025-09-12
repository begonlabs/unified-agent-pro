/// meta-webhook/handlers/instagram.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// supabase-project/volumes/meta-webhook/handlers/instagram.ts
/// <reference types="https://esm.sh/@types/deno/index.d.ts" />
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VerificationRequest {
  channel_id: string;
}

interface VerificationResponse {
  success: boolean;
  verification_code?: string;
  expires_at?: string;
  error?: string;
}

/**
 * Generates a unique verification code in format IG-XXXXX
 * @returns string - Unique verification code
 */
function generateVerificationCode(): string {
  // Generate 5-digit random number
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  return `IG-${randomNumber}`;
}

/**
 * Creates a new Instagram verification code for a specific channel
 * Helps resolve business account ID conflicts when instagram_user_id == instagram_business_account_id
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('🔧 Instagram Verification Code Generator started');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const body = await req.json() as VerificationRequest;
    const { channel_id } = body;

    if (!channel_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Channel ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📋 Request data:', { channel_id });

    // Get authorization header to extract user ID
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid authentication' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Verify that the channel belongs to the user and is Instagram
    const { data: channel, error: channelError } = await supabase
      .from('communication_channels')
      .select('*')
      .eq('id', channel_id)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single();

    if (channelError || !channel) {
      console.error('❌ Channel verification error:', channelError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Instagram channel not found or access denied' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📱 Instagram channel verified:', {
      id: channel.id,
      channel_type: channel.channel_type,
      user_id: channel.user_id
    });

    // Check if this channel needs verification (instagram_user_id == instagram_business_account_id)
    const channelConfig = channel.channel_config as Record<string, unknown>;
    const needsVerification = channelConfig?.instagram_user_id === channelConfig?.instagram_business_account_id;

    if (!needsVerification && channelConfig?.instagram_business_account_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Channel already has valid business account ID' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🔍 Channel needs verification:', { needsVerification });

    // Expire any existing pending verifications for this channel
    await supabase
      .from('instagram_verifications')
      .update({ status: 'expired' })
      .eq('channel_id', channel_id)
      .eq('status', 'pending');

    console.log('⏰ Expired existing verifications');

    // Generate unique verification code (with retry logic)
    let verificationCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      verificationCode = generateVerificationCode();
      attempts++;

      // Check if code already exists
      const { data: existingCode } = await supabase
        .from('instagram_verifications')
        .select('id')
        .eq('verification_code', verificationCode)
        .single();

      if (!existingCode) {
        break;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique verification code');
      }
    } while (attempts < maxAttempts);

    console.log('🎯 Generated unique verification code:', verificationCode);

    // Create verification record
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    const { data: verification, error: verificationError } = await supabase
      .from('instagram_verifications')
      .insert({
        user_id: user.id,
        channel_id: channel_id,
        verification_code: verificationCode,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (verificationError || !verification) {
      console.error('❌ Error creating verification:', verificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create verification code' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Verification created successfully:', {
      id: verification.id,
      code: verification.verification_code,
      expires_at: verification.expires_at
    });

    const response: VerificationResponse = {
      success: true,
      verification_code: verificationCode,
      expires_at: expiresAt.toISOString()
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Critical error in Instagram verification generator:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
