// whatsapp-embedded-signup/index.ts
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Deno Edge Function: WhatsApp Embedded Signup Handler
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types and Interfaces
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
  quality_rating?: string;
  status?: string;
}

interface ConfigurationVariables {
  appId: string;
  appSecret: string;
  graphVersion: string;
  webhookUrl: string;
  verifyToken: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  frontendUrl: string;
  environment: string;
}

interface RequestPayload {
  code: string;
  state: string;
  userId: string;
}

interface StateData {
  user_id: string;
  timestamp: number;
  nonce: string;
}

// Configuration and Constants
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Utility Functions
function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  clientData.count++;
  return false;
}

function validateConfiguration(): ConfigurationVariables {
  const config = {
    appId: Deno.env.get('WHATSAPP_APP_ID') || Deno.env.get('META_APP_ID'),
    appSecret: Deno.env.get('WHATSAPP_APP_SECRET') || Deno.env.get('META_APP_SECRET'),
    graphVersion: Deno.env.get('META_GRAPH_VERSION') || 'v18.0',
    webhookUrl: Deno.env.get('WHATSAPP_WEBHOOK_URL') || 'https://supabase.ondai.ai/functions/v1/whatsapp-webhook',
    verifyToken: Deno.env.get('WHATSAPP_VERIFY_TOKEN'),
    supabaseUrl: Deno.env.get('SUPABASE_URL'),
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    frontendUrl: Deno.env.get('FRONTEND_URL') || 'https://ondai.ai',
    environment: Deno.env.get('ENVIRONMENT') || 'production'
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => !value && key !== 'environment')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config as ConfigurationVariables;
}

function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000); // Limit string length
  }
  return input;
}

function validateStateParameter(state: string): StateData {
  try {
    const decoded = decodeURIComponent(state);
    const parsed = JSON.parse(decoded);
    
    if (!parsed.user_id || !parsed.timestamp || !parsed.nonce) {
      throw new Error('Invalid state structure');
    }
    
    // Check if state is not too old (max 1 hour)
    const stateAge = Date.now() - parsed.timestamp;
    if (stateAge > 3600000) {
      throw new Error('State parameter expired');
    }
    
    return parsed;
  } catch (error) {
    throw new Error(`Invalid state parameter: ${error.message}`);
  }
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = MAX_RETRY_ATTEMPTS): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error (5xx) - retry
      if (attempt === maxRetries) {
        return response;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  throw new Error('Max retry attempts exceeded');
}

function logEvent(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'whatsapp-embedded-signup',
    ...metadata
  };
  
  // In production, send to logging service
  console.log(JSON.stringify(logEntry));
}

async function exchangeCodeForToken(code: string, config: ConfigurationVariables): Promise<string> {
  logEvent('info', 'Exchanging authorization code for access token');
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/oauth/access_token`,
    {
      method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
        client_id: config.appId,
        client_secret: config.appSecret,
            code: code
          }).toString()
        }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'Token exchange failed', { status: response.status, error: errorText });
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const tokenData = await response.json();
  
  if (!tokenData.access_token) {
    logEvent('error', 'No access token in response', { tokenData });
    throw new Error('No access token received from Facebook');
  }

  logEvent('info', 'Token exchange successful');
  return tokenData.access_token;
}

async function fetchWhatsAppBusinessAccounts(token: string, config: ConfigurationVariables): Promise<WhatsAppBusinessAccount[]> {
  logEvent('info', 'Fetching WhatsApp Business Accounts');
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/me/whatsapp_business_accounts?access_token=${token}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'WABA fetch failed', { status: response.status, error: errorText });
    throw new Error(`Failed to fetch WhatsApp Business Accounts: ${response.status} - ${errorText}`);
  }

  const wabaData = await response.json();
  const wabas = wabaData.data || [];

      if (wabas.length === 0) {
    logEvent('error', 'No WhatsApp Business Accounts found');
    throw new Error('No WhatsApp Business Accounts found for this user');
  }

  logEvent('info', 'WhatsApp Business Accounts fetched', { count: wabas.length });
  return wabas;
}

async function fetchWABADetails(wabaId: string, token: string, config: ConfigurationVariables): Promise<WhatsAppBusinessAccount> {
  logEvent('info', 'Fetching WABA details', { wabaId });
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/${wabaId}?` +
        `fields=name,account_review_status,business_verification_status&` +
    `access_token=${token}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'WABA details fetch failed', { wabaId, status: response.status, error: errorText });
    throw new Error(`Failed to fetch WABA details: ${response.status} - ${errorText}`);
  }

  const wabaDetails = await response.json();
  logEvent('info', 'WABA details fetched', { wabaId, name: wabaDetails.name });
  return wabaDetails;
}

async function fetchPhoneNumbers(wabaId: string, token: string, config: ConfigurationVariables): Promise<WhatsAppPhoneNumber[]> {
  logEvent('info', 'Fetching phone numbers', { wabaId });
  
  const response = await fetchWithRetry(
    `https://graph.facebook.com/${config.graphVersion}/${wabaId}/phone_numbers?access_token=${token}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    logEvent('error', 'Phone numbers fetch failed', { wabaId, status: response.status, error: errorText });
    throw new Error(`Failed to fetch phone numbers: ${response.status} - ${errorText}`);
  }

  const phoneNumbersData = await response.json();
  const phoneNumbers = phoneNumbersData.data || [];

      if (phoneNumbers.length === 0) {
    logEvent('error', 'No phone numbers found', { wabaId });
    throw new Error('No phone numbers found for this WhatsApp Business Account');
  }

  logEvent('info', 'Phone numbers fetched', { wabaId, count: phoneNumbers.length });
  return phoneNumbers;
}

async function registerPhoneNumber(phoneNumberId: string, token: string, config: ConfigurationVariables): Promise<boolean> {
  logEvent('info', 'Registering phone number', { phoneNumberId });
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/${phoneNumberId}/register`,
          {
            method: 'POST',
            headers: {
          'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp'
            })
          }
    );

    if (response.ok) {
      logEvent('info', 'Phone number registered successfully', { phoneNumberId });
      return true;
        } else {
      const errorText = await response.text();
      logEvent('warn', 'Phone number registration failed - might already be registered', { 
        phoneNumberId, 
        status: response.status, 
        error: errorText 
      });
      return false;
    }
  } catch (error) {
    logEvent('warn', 'Phone number registration error', { phoneNumberId, error: error.message });
    return false;
  }
}

async function configureWebhooks(wabaId: string, token: string, config: ConfigurationVariables): Promise<boolean> {
  logEvent('info', 'Configuring webhooks', { wabaId });
  
  try {
    const response = await fetchWithRetry(
      `https://graph.facebook.com/${config.graphVersion}/${wabaId}/subscribed_apps`,
          {
            method: 'POST',
            headers: {
          'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
    );

    if (response.ok) {
      logEvent('info', 'Webhooks configured successfully', { wabaId });
      return true;
        } else {
      const errorText = await response.text();
      logEvent('error', 'Webhook configuration failed', { 
        wabaId, 
        status: response.status, 
        error: errorText 
      });
      return false;
    }
  } catch (error) {
    logEvent('error', 'Webhook configuration error', { wabaId, error: error.message });
    return false;
  }
}

async function saveToDatabase(userId: string, channelConfig: unknown, config: ConfigurationVariables): Promise<void> {
  logEvent('info', 'Saving configuration to database', { userId });
  
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

  try {
    // Start transaction-like operation
      const { data: existingChannel, error: checkError } = await supabase
        .from('communication_channels')
      .select('id, channel_config')
        .eq('user_id', userId)
        .eq('channel_type', 'whatsapp')
        .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw checkError;
    }

      let dbError;
      if (existingChannel) {
        // Update existing channel
      logEvent('info', 'Updating existing WhatsApp channel', { userId, channelId: existingChannel.id });
      
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
      logEvent('info', 'Creating new WhatsApp channel', { userId });
      
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
      logEvent('error', 'Database operation failed', { userId, error: dbError.message });
      throw new Error(`Database error: ${dbError.message}`);
    }

    logEvent('info', 'Configuration saved to database successfully', { userId });
  } catch (error) {
    logEvent('error', 'Database operation error', { userId, error: error.message });
    throw error;
  }
}

function createSuccessResponse(data: unknown, isCallback: boolean = false, config: ConfigurationVariables) {
  if (isCallback) {
    // OAuth callback - redirect to frontend
    const redirectUrl = `${config.frontendUrl}/dashboard?success=true&channel=whatsapp&business_name=${encodeURIComponent(data.businessName)}&phone_number=${encodeURIComponent(data.phoneNumber)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        ...CORS_HEADERS
      }
    });
  }

  // API response
        return new Response(
          JSON.stringify({ 
      success: true,
      data,
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

function createErrorResponse(error: string, status: number = 400, debug?: unknown) {
  const response = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(debug && Deno.env.get('ENVIRONMENT') !== 'production' ? { debug } : {})
  };

  return new Response(
    JSON.stringify(response),
    { 
      status, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    }
  );
}

// Main Handler
serve(async (req) => {
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: CORS_HEADERS });
    }

    // Rate limiting
    if (isRateLimited(clientIP)) {
      logEvent('warn', 'Rate limit exceeded', { clientIP });
      return createErrorResponse('Rate limit exceeded. Try again later.', 429);
    }

    // Validate configuration
    const config = validateConfiguration();
    
    logEvent('info', 'Request received', { 
      method: req.method, 
      clientIP,
      userAgent: req.headers.get('user-agent')?.slice(0, 100)
    });

    // Health check endpoint
    if (req.method === 'GET' && new URL(req.url).pathname.endsWith('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          service: 'whatsapp-embedded-signup',
          timestamp: new Date().toISOString(),
          environment: config.environment
        }),
        { 
          status: 200, 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and validate request data
    let code: string, state: string, userId: string;
    let isCallback = false;
    
    if (req.method === 'POST' && req.headers.get('content-type')?.includes('application/json')) {
      // API call from frontend
      const body = await req.json();
      code = sanitizeInput(body.code);
      state = sanitizeInput(body.state);
      userId = sanitizeInput(body.userId);
    } else if (req.method === 'GET') {
      // OAuth callback
      const url = new URL(req.url);
      code = sanitizeInput(url.searchParams.get('code'));
      state = sanitizeInput(url.searchParams.get('state'));
      isCallback = true;
      
      // Extract userId from state
      if (state) {
        const stateData = validateStateParameter(state);
        userId = stateData.user_id;
      }
    } else {
      return createErrorResponse('Invalid request method or content type', 405);
    }

    // Validate required parameters
    if (!code) {
      return createErrorResponse('Missing authorization code', 400);
    }
    
    if (!userId) {
      return createErrorResponse('Missing or invalid user ID', 400);
    }

    // Main processing flow
    logEvent('info', 'Starting WhatsApp embedded signup flow', { userId, isCallback });

    // Step 1: Exchange code for token
    const businessIntegrationToken = await exchangeCodeForToken(code, config);

    // Step 2: Get WhatsApp Business Accounts
    const wabas = await fetchWhatsAppBusinessAccounts(businessIntegrationToken, config);
    const selectedWaba = wabas[0]; // Use first WABA

    // Step 3: Get WABA details
    const wabaDetails = await fetchWABADetails(selectedWaba.id, businessIntegrationToken, config);

    // Step 4: Get phone numbers
    const phoneNumbers = await fetchPhoneNumbers(selectedWaba.id, businessIntegrationToken, config);
    const selectedPhoneNumber = phoneNumbers[0]; // Use first phone number

    // Step 5: Register phone number
    const phoneRegistered = await registerPhoneNumber(selectedPhoneNumber.id, businessIntegrationToken, config);

    // Step 6: Configure webhooks
    const webhookConfigured = await configureWebhooks(selectedWaba.id, businessIntegrationToken, config);

    // Step 7: Prepare channel configuration
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
      webhook_url: config.webhookUrl,
      phone_registered: phoneRegistered,
      connected_at: new Date().toISOString(),
      last_health_check: new Date().toISOString()
    };

    // Step 8: Save to database
    await saveToDatabase(userId, channelConfig, config);

    // Step 9: Prepare response data
    const responseData = {
      businessName: wabaDetails.name,
      phoneNumber: selectedPhoneNumber.display_phone_number,
      wabaId: selectedWaba.id,
      phoneNumberId: selectedPhoneNumber.id,
      verifiedName: selectedPhoneNumber.verified_name,
      status: 'connected',
      webhookConfigured,
      phoneRegistered,
      accountReviewStatus: wabaDetails.account_review_status,
      businessVerificationStatus: wabaDetails.business_verification_status
    };

    const processingTime = Date.now() - startTime;
    logEvent('info', 'WhatsApp embedded signup completed successfully', { 
      userId, 
      processingTime,
      businessName: wabaDetails.name,
      phoneNumber: selectedPhoneNumber.display_phone_number
    });

    return createSuccessResponse(responseData, isCallback, config);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logEvent('error', 'Critical error in WhatsApp embedded signup', { 
      clientIP,
      processingTime,
      error: error.message,
      stack: error.stack
    });

    return createErrorResponse(
      config?.environment === 'development' ? error.message : 'Internal server error',
      500,
      config?.environment === 'development' ? { stack: error.stack } : undefined
    );
  }
});